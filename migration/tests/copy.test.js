import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { copyTable, deriveChecks } from '../bin/migrate.js';
import { buildPlan } from '../lib/planner.js';
import { connectPostgres, createQuarantineTable, readTargetExactRowCounts } from '../lib/postgres.js';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const SCHEMA = 'migration_copy_test';
const TABLE = 'copy_targets';

const sourceColumn = (name, dataType, length = null) => ({
  name,
  dataType,
  length,
  isNullable: true,
  isIdentity: false,
  isComputed: false,
  isRowVersion: false,
  hasDefault: false,
});

const targetColumn = (name, dataType, type, isArray = false) => ({
  name,
  dataType,
  type,
  maxLength: null,
  isNullable: true,
  hasDefault: false,
  isIdentity: false,
  isArray,
});

const legacyColumns = [
  sourceColumn('id', 'uniqueidentifier'),
  sourceColumn('name', 'nvarchar', '255'),
  sourceColumn('total', 'decimal', '12,2'),
  sourceColumn('created_at', 'datetime2'),
  sourceColumn('is_active', 'bit'),
  sourceColumn('scopes', 'nvarchar', 'max'),
  sourceColumn('ip_whitelist', 'nvarchar', 'max'),
  sourceColumn('ip_address', 'nvarchar', '45'),
];

const postgresColumns = [
  targetColumn('id', 'uuid', 'uuid'),
  targetColumn('name', 'varchar', 'character varying(255)'),
  targetColumn('total', 'numeric', 'numeric(12,2)'),
  targetColumn('created_at', 'timestamp', 'timestamp without time zone'),
  targetColumn('is_active', 'boolean', 'boolean'),
  targetColumn('scopes', 'jsonb', 'jsonb'),
  targetColumn('ip_whitelist', 'ARRAY', 'inet[]', true),
  targetColumn('ip_address', 'inet', 'inet'),
];

const planColumns = () =>
  buildPlan({
    source: { tables: [{ name: TABLE, columns: legacyColumns }] },
    target: { tables: [{ name: TABLE, columns: postgresColumns }] },
    foreignKeys: [],
  }).tables[0].columns;

const sourceRow = (index, overrides = {}) => ({
  id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
  name: `Row ${index + 1}`,
  total: `${index + 1}.25`,
  created_at: new Date(2026, 0, 1, 0, index, 0),
  is_active: index % 2,
  scopes: '["read"]',
  ip_whitelist: '["10.0.0.1"]',
  ip_address: '127.0.0.1',
  ...overrides,
});

const pages = (...groups) => groups;

const fakeSource = (groups) => {
  const queries = [];
  let next = 0;

  return {
    queries,
    request() {
      return {
        input() {
          return this;
        },
        async query(text) {
          queries.push(text);
          const page = next < groups.length ? groups[next] : [];
          next += 1;
          return { recordset: page };
        },
      };
    },
  };
};

const runCopy = async ({ groups, primaryKeys = ['id'], args = {} }) => {
  const sourcePool = fakeSource(groups);
  const targetClient = await connectPostgres(connectionString);
  const stats = { tables: [] };

  try {
    await copyTable({
      sourcePool,
      targetClient,
      table: { name: TABLE },
      planColumns: planColumns(),
      primaryKeys,
      args: { 'batch-size': 3, ...args },
      stats,
      schema: SCHEMA,
    });
  } finally {
    await targetClient.end().catch(() => {});
  }

  return { sourcePool, stats };
};

const countRows = async (client) => (await readTargetExactRowCounts(client, [TABLE], { schema: SCHEMA }))[TABLE];

describeWithDatabase('row copy loop', () => {
  let client;

  beforeAll(async () => {
    client = new pg.Client({ connectionString });
    await client.connect();
    await client.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await client.query(`CREATE SCHEMA ${SCHEMA}`);
    await client.query(`
      CREATE TABLE ${SCHEMA}.${TABLE} (
        id uuid,
        name character varying(255),
        total numeric(12,2),
        created_at timestamp without time zone,
        is_active boolean,
        scopes jsonb,
        ip_whitelist inet[],
        ip_address inet
      )
    `);
  });

  afterAll(async () => {
    if (!client) return;
    await client.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await client.end().catch(() => {});
  });

  beforeEach(async () => {
    await client.query(`TRUNCATE ${SCHEMA}.${TABLE}`);
  });

  it('copies every row exactly once with keyset pagination', async () => {
    const ten = Array.from({ length: 10 }, (unused, index) => sourceRow(index));
    const { sourcePool, stats } = await runCopy({ groups: pages(ten.slice(0, 3), ten.slice(3, 6), ten.slice(6, 9), ten.slice(9)) });

    expect(stats.tables[0]).toEqual({ table: TABLE, copied: 10, quarantined: 0 });
    expect(await countRows(client)).toBe(10);

    const { rows } = await client.query(
      `SELECT id::text, name, total::text, is_active FROM ${SCHEMA}.${TABLE} ORDER BY id`
    );
    expect(rows).toHaveLength(10);
    expect(new Set(rows.map((row) => row.id)).size).toBe(10);
    expect(rows[0]).toMatchObject({ name: 'Row 1', total: '1.25', is_active: false });
    expect(rows[9]).toMatchObject({ name: 'Row 10', total: '10.25', is_active: true });
  });

  it('asks for the next page with a keyset predicate and stops when a page is short', async () => {
    const five = Array.from({ length: 5 }, (unused, index) => sourceRow(index));
    const { sourcePool, stats } = await runCopy({ groups: pages(five.slice(0, 3), five.slice(3)) });

    expect(stats.tables[0].copied).toBe(5);
    expect(sourcePool.queries).toHaveLength(2);
    expect(sourcePool.queries[0]).not.toMatch(/WHERE \(/i);
    expect(sourcePool.queries[0]).toMatch(/SELECT TOP \(3\)/i);
    expect(sourcePool.queries[1]).toMatch(/\[\[?id\]?\]?\) > \(@key0\)/i);
  });

  it('stops after a single empty page', async () => {
    const { sourcePool, stats } = await runCopy({ groups: pages() });

    expect(stats.tables[0]).toEqual({ table: TABLE, copied: 0, quarantined: 0 });
    expect(sourcePool.queries).toHaveLength(1);
  });

  it('falls back to offset paging when the source table has no primary key', async () => {
    const five = Array.from({ length: 5 }, (unused, index) => sourceRow(index));
    const { sourcePool, stats } = await runCopy({
      groups: pages(five.slice(0, 3), five.slice(3)),
      primaryKeys: [],
    });

    expect(stats.tables[0].copied).toBe(5);
    expect(sourcePool.queries[0]).toMatch(/OFFSET 0 ROWS FETCH NEXT 3 ROWS ONLY/i);
    expect(sourcePool.queries[1]).toMatch(/OFFSET 3 ROWS FETCH NEXT 3 ROWS ONLY/i);
  });

  it('rolls back the whole batch when a row cannot be inserted', async () => {
    const bad = [sourceRow(0), sourceRow(1, { id: 'not-a-uuid' }), sourceRow(2)];

    await expect(runCopy({ groups: pages(bad) })).rejects.toThrow(/uuid/i);
    expect(await countRows(client)).toBe(0);
  });

  it('quarantines only the rejected rows when skipping is enabled', async () => {
    await createQuarantineTable(client, { schema: SCHEMA });
    await client.query(`TRUNCATE ${SCHEMA}.migration_quarantine`);

    const bad = [sourceRow(0), sourceRow(1, { id: 'not-a-uuid' }), sourceRow(2)];
    const { stats } = await runCopy({
      groups: pages(bad),
      args: { 'skip-bad-rows': true, quarantine: true },
    });

    expect(stats.tables[0]).toEqual({ table: TABLE, copied: 2, quarantined: 1 });
    expect(await countRows(client)).toBe(2);

    const { rows } = await client.query(
      `SELECT source_table, source_key, reason, row->>'id' AS id FROM ${SCHEMA}.migration_quarantine`
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].source_table).toBe(TABLE);
    expect(rows[0].id).toBe('not-a-uuid');
    expect(rows[0].reason).toMatch(/uuid/i);
  });

  it('converts money, timestamps, json and network values exactly', async () => {
    await runCopy({ groups: pages([sourceRow(0, { total: '9999999999.99' })]) });

    const { rows } = await client.query(
      `SELECT total::text,
              created_at::text,
              is_active,
              array_to_string(ip_whitelist, ',') AS whitelist,
              host(ip_address) AS address,
              scopes::text
         FROM ${SCHEMA}.${TABLE}`
    );

    expect(rows[0]).toEqual({
      total: '9999999999.99',
      created_at: '2026-01-01 00:00:00',
      is_active: false,
      whitelist: '10.0.0.1',
      address: '127.0.0.1',
      scopes: '["read"]',
    });
  });

  it('selects the money columns for verification', () => {
    const checks = deriveChecks({ tables: [{ name: TABLE, columns: planColumns() }] });
    expect(checks).toEqual([{ table: TABLE, column: 'total' }]);
  });
});
