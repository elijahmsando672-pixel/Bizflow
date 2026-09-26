import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { findOrphanRows, readTargetForeignKeys } from '../lib/postgres.js';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const SCHEMA = 'migration_fk_test';

describeWithDatabase('foreign key inspection', () => {
  let client;

  beforeAll(async () => {
    client = new pg.Client({ connectionString });
    await client.connect();
    await client.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await client.query(`CREATE SCHEMA ${SCHEMA}`);
    await client.query(`
      CREATE TABLE ${SCHEMA}.users (id uuid PRIMARY KEY);
      CREATE TABLE ${SCHEMA}.parents (
        region TEXT NOT NULL,
        code TEXT NOT NULL,
        PRIMARY KEY (region, code)
      );
      CREATE TABLE ${SCHEMA}.children (
        id uuid PRIMARY KEY,
        region TEXT,
        code TEXT,
        owner_id uuid REFERENCES ${SCHEMA}.users(id),
        editor_id uuid,
        CONSTRAINT children_editor_fk FOREIGN KEY (editor_id) REFERENCES ${SCHEMA}.users(id)
      );
      CREATE TABLE ${SCHEMA}.composite_children (
        region TEXT,
        code TEXT,
        CONSTRAINT composite_children_parent_fk FOREIGN KEY (region, code)
          REFERENCES ${SCHEMA}.parents (region, code)
      );
    `);
  });

  afterAll(async () => {
    if (!client) return;
    await client.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await client.end().catch(() => {});
  });

  it('keeps separate foreign keys between the same pair of tables apart', async () => {
    const foreignKeys = await readTargetForeignKeys(client, { schema: SCHEMA });
    const onChildren = foreignKeys.filter((fk) => fk.table === 'children');

    expect(onChildren).toHaveLength(2);
    expect(onChildren.map((fk) => fk.columns.map((column) => column.column)).sort()).toEqual([
      ['editor_id'],
      ['owner_id'],
    ]);
  });

  it('reads composite foreign keys as one constraint with every column', async () => {
    const foreignKeys = await readTargetForeignKeys(client, { schema: SCHEMA });
    const composite = foreignKeys.find((fk) => fk.table === 'composite_children');

    expect(composite.parentTable).toBe('parents');
    expect(composite.columns).toEqual([
      { column: 'region', parentColumn: 'region' },
      { column: 'code', parentColumn: 'code' },
    ]);
  });

  it('counts orphans per constraint instead of merging them', async () => {
    await client.query('SET session_replication_role = replica');
    await client.query(`
      INSERT INTO ${SCHEMA}.users (id) VALUES ('11111111-1111-1111-1111-111111111111');
      INSERT INTO ${SCHEMA}.children (id, owner_id, editor_id) VALUES
        ('33333333-3333-3333-3333-333333333333',
         '11111111-1111-1111-1111-111111111111',
         '22222222-2222-2222-2222-222222222222');
    `);
    await client.query('SET session_replication_role = origin');

    const foreignKeys = await readTargetForeignKeys(client, { schema: SCHEMA });
    const orphans = await findOrphanRows(client, foreignKeys.filter((fk) => fk.table === 'children'), {
      schema: SCHEMA,
    });

    expect(orphans).toEqual([{ table: 'children', count: 1 }]);
  });

  it('finds orphans that break only part of a composite key', async () => {
    await client.query('SET session_replication_role = replica');
    await client.query(`
      INSERT INTO ${SCHEMA}.parents (region, code) VALUES ('KE', '001');
      INSERT INTO ${SCHEMA}.composite_children (region, code) VALUES ('KE', '001'), ('KE', '404');
    `);
    await client.query('SET session_replication_role = origin');

    const foreignKeys = await readTargetForeignKeys(client, { schema: SCHEMA });
    const orphans = await findOrphanRows(
      client,
      foreignKeys.filter((fk) => fk.table === 'composite_children'),
      { schema: SCHEMA }
    );

    expect(orphans).toEqual([{ table: 'composite_children', count: 1 }]);
  });
});
