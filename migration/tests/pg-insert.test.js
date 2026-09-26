import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { buildPlan } from '../lib/planner.js';
import { buildInsertStatement } from '../lib/sqlbuild.js';
import { toMigrationValue } from '../lib/types.js';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const sourceTable = (name, columns) => ({
  name,
  columns: columns.map((column) => ({
    name: column.name,
    dataType: column.dataType,
    length: column.length === undefined ? null : column.length,
    isNullable: true,
    isIdentity: false,
    isComputed: false,
    isRowVersion: false,
    hasDefault: false,
  })),
});

const targetTable = (name, columns) => ({
  name,
  columns: columns.map((column) => ({
    name: column.name,
    dataType: column.dataType,
    type: column.type,
    maxLength: column.maxLength === undefined ? null : column.maxLength,
    isNullable: true,
    hasDefault: false,
    isIdentity: false,
    isArray: Boolean(column.isArray),
  })),
});

const legacyColumns = [
  { name: 'id', dataType: 'uniqueidentifier' },
  { name: 'total', dataType: 'decimal', length: '12,2' },
  { name: 'created_at', dataType: 'datetime2' },
  { name: 'is_active', dataType: 'bit' },
  { name: 'scopes', dataType: 'nvarchar', length: 'max' },
  { name: 'ip_whitelist', dataType: 'nvarchar', length: 'max' },
  { name: 'ip_address', dataType: 'nvarchar', length: '45' },
  { name: 'notes', dataType: 'nvarchar', length: '255' },
];

const postgresColumns = [
  { name: 'id', dataType: 'uuid', type: 'uuid' },
  { name: 'total', dataType: 'numeric', type: 'numeric(12,2)' },
  { name: 'created_at', dataType: 'timestamp', type: 'timestamp without time zone' },
  { name: 'is_active', dataType: 'boolean', type: 'boolean' },
  { name: 'scopes', dataType: 'jsonb', type: 'jsonb' },
  { name: 'ip_whitelist', dataType: 'ARRAY', type: 'inet[]', isArray: true },
  { name: 'ip_address', dataType: 'inet', type: 'inet' },
  { name: 'notes', dataType: 'varchar', type: 'character varying(255)', maxLength: 255 },
];

const planFor = (table) =>
  buildPlan({
    source: { tables: [sourceTable(table, legacyColumns)] },
    target: { tables: [targetTable(table, postgresColumns)] },
    foreignKeys: [],
  }).tables[0];

const DDL = `CREATE TEMP TABLE %TABLE% (
  id uuid,
  total numeric(12,2),
  created_at timestamp without time zone,
  is_active boolean,
  scopes jsonb,
  ip_whitelist inet[],
  ip_address inet,
  notes character varying(255)
)`;

const createProbe = async (client, name) => {
  await client.query(DDL.replace('%TABLE%', name));
  return planFor(name);
};

const insertRow = async (client, name, columns, row) => {
  const values = columns.map((column) =>
    toMigrationValue(column.valueStrategy || column.strategy, row[column.sourceName])
  );
  const statement = buildInsertStatement(name, columns, [values]);
  await client.query(statement.sql, statement.values);
};

describeWithDatabase('PostgreSQL insert pipeline', () => {
  let client;

  beforeAll(async () => {
    client = new pg.Client({ connectionString });
    await client.connect();
  });

  afterAll(async () => {
    if (client) await client.end().catch(() => {});
  });

  it('produces a column plan with casts for every legacy column', () => {
    const plan = planFor('any_table');
    expect(plan.warnings).toEqual([]);
    expect(plan.columns.map((column) => column.cast)).toEqual([
      'uuid',
      'numeric',
      'timestamp without time zone',
      'boolean',
      'jsonb',
      'inet[]',
      'inet',
      null,
    ]);
  });

  it('lands SQL Server values in PostgreSQL with the right types', async () => {
    const columns = await createProbe(client, 'roundtrip');
    await insertRow(client, 'roundtrip', columns.columns, {
      id: '0f9d4b7a-1c2e-4f3a-9b8c-5d6e7f801234',
      total: '1234.56',
      created_at: new Date(2026, 2, 4, 15, 30, 5, 120),
      is_active: 1,
      scopes: '["read","write"]',
      ip_whitelist: '["10.0.0.1","10.0.0.2"]',
      ip_address: '127.0.0.1',
      notes: "O'Brien & Co (Ltd)",
    });

    const { rows } = await client.query(
      `SELECT id::text,
              total::text,
              created_at::text,
              is_active::text,
              scopes::text,
              array_to_string(ip_whitelist, ','),
              host(ip_address),
              notes
         FROM roundtrip`
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: '0f9d4b7a-1c2e-4f3a-9b8c-5d6e7f801234',
      total: '1234.56',
      created_at: '2026-03-04 15:30:05.12',
      is_active: 'true',
      scopes: '["read", "write"]',
      array_to_string: '10.0.0.1,10.0.0.2',
      host: '127.0.0.1',
      notes: "O'Brien & Co (Ltd)",
    });
  });

  it('stores empty json text as null and an empty whitelist as an empty array', async () => {
    const columns = await createProbe(client, 'empties');
    await insertRow(client, 'empties', columns.columns, {
      id: '1f9d4b7a-1c2e-4f3a-9b8c-5d6e7f801234',
      total: '0',
      created_at: null,
      is_active: 0,
      scopes: '',
      ip_whitelist: '',
      ip_address: null,
      notes: null,
    });

    const { rows } = await client.query(
      `SELECT scopes IS NULL AS scopes_null,
              ip_whitelist IS NOT NULL AS whitelist_kept,
              COALESCE(array_length(ip_whitelist, 1), 0) AS whitelist_size,
              is_active
         FROM empties`
    );

    expect(rows[0]).toEqual({
      scopes_null: true,
      whitelist_kept: true,
      whitelist_size: 0,
      is_active: false,
    });
  });

  it('rejects values that the target type cannot represent', async () => {
    const columns = await createProbe(client, 'rejects');
    const row = {
      id: 'not-a-uuid',
      total: '1',
      created_at: null,
      is_active: 1,
      scopes: '[]',
      ip_whitelist: '[]',
      ip_address: null,
      notes: null,
    };

    await expect(insertRow(client, 'rejects', columns.columns, row)).rejects.toThrow(/uuid/i);
  });

  it('rejects malformed json payloads', async () => {
    const columns = await createProbe(client, 'badjson');
    const row = {
      id: '2f9d4b7a-1c2e-4f3a-9b8c-5d6e7f801234',
      total: '1',
      created_at: null,
      is_active: 1,
      scopes: '["read"',
      ip_whitelist: '[]',
      ip_address: null,
      notes: null,
    };

    await expect(insertRow(client, 'badjson', columns.columns, row)).rejects.toThrow(/json/i);
  });

  it('keeps money exact up to the column precision', async () => {
    const columns = await createProbe(client, 'money');
    await insertRow(client, 'money', columns.columns, {
      id: '3f9d4b7a-1c2e-4f3a-9b8c-5d6e7f801234',
      total: '9999999999.99',
      created_at: null,
      is_active: 1,
      scopes: '[]',
      ip_whitelist: '[]',
      ip_address: null,
      notes: null,
    });

    const { rows } = await client.query(`SELECT total::text FROM money`);
    expect(rows[0].total).toBe('9999999999.99');
  });
});
