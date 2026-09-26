import pg from 'pg';

const SKIP_TABLES = new Set(['schema_migrations', 'migration_quarantine']);

const quote = (identifier) => `"${identifier.replace(/"/g, '""')}"`;

const qualify = (identifier, schema) => (schema ? `${quote(schema)}.${quote(identifier)}` : quote(identifier));

export const connectPostgres = async (connectionString) => {
  const client = new pg.Client({ connectionString, max: 1 });
  await client.connect();
  return client;
};

const DATA_TYPE_ALIASES = {
  'timestamp without time zone': 'timestamp',
  'timestamp with time zone': 'timestamptz',
  'time without time zone': 'time',
  'time with time zone': 'timetz',
  'double precision': 'double',
  'character varying': 'varchar',
  character: 'char',
};

const normalizeDataType = (dataType) => DATA_TYPE_ALIASES[dataType] || dataType;

const targetType = (row) => {
  if (row.data_type === 'USER-DEFINED' || row.data_type === 'ARRAY') {
    return row.data_type === 'ARRAY' ? `${row.udt_name.replace(/^_/, '')}[]` : row.udt_name;
  }
  if (row.data_type === 'character varying' || row.data_type === 'character') {
    return row.character_maximum_length
      ? `${row.data_type}(${row.character_maximum_length})`
      : row.data_type;
  }
  if (row.data_type === 'numeric') {
    return row.numeric_precision
      ? `numeric(${row.numeric_precision},${row.numeric_scale ?? 0})`
      : 'numeric';
  }
  return row.data_type;
};

export const readTargetMetadata = async (client, { schema = 'public', tables } = {}) => {
  const parameters = [schema];
  let filter = '';
  if (tables && tables.length) {
    parameters.push(tables);
    filter = ` AND table_name = ANY($2::text[])`;
  }

  const { rows } = await client.query(
    `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default,
            character_maximum_length, numeric_precision, numeric_scale, is_identity, ordinal_position
     FROM information_schema.columns
     WHERE table_schema = $1${filter}
     ORDER BY table_name, ordinal_position`,
    parameters
  );

  const byTable = new Map();
  for (const row of rows) {
    const name = row.table_name;
    if (SKIP_TABLES.has(name) || SKIP_TABLES.has(name.toLowerCase())) continue;
    if (!byTable.has(name)) byTable.set(name, { name, columns: [] });
    byTable.get(name).columns.push({
      name: row.column_name,
      dataType: normalizeDataType(row.data_type),
      rawDataType: row.data_type,
      type: targetType(row),
      maxLength:
        row.character_maximum_length === null || row.character_maximum_length < 0
          ? null
          : Number(row.character_maximum_length),
      isNullable: row.is_nullable === 'YES',
      hasDefault: row.column_default !== null,
      isIdentity: String(row.is_identity) === 'YES',
      isArray: row.data_type === 'ARRAY',
    });
  }

  return { dialect: 'postgresql', schema, tables: [...byTable.values()] };
};

export const readTargetForeignKeys = async (client, { schema = 'public' } = {}) => {
  const { rows } = await client.query(
    `SELECT con.conname AS constraint_name,
            child.relname AS table_name,
            parent.relname AS parent_table,
            child_attribute.attname AS column_name,
            parent_attribute.attname AS parent_column
     FROM pg_constraint con
     JOIN pg_class child ON child.oid = con.conrelid
     JOIN pg_class parent ON parent.oid = con.confrelid
     JOIN pg_namespace ns ON ns.oid = child.relnamespace
     CROSS JOIN LATERAL unnest(con.conkey, con.confkey) AS keys(child_attnum, parent_attnum)
     JOIN pg_attribute child_attribute
       ON child_attribute.attrelid = child.oid AND child_attribute.attnum = keys.child_attnum
     JOIN pg_attribute parent_attribute
       ON parent_attribute.attrelid = parent.oid AND parent_attribute.attnum = keys.parent_attnum
     WHERE con.contype = 'f' AND ns.nspname = $1
     ORDER BY con.conname`,
    [schema]
  );

  const byConstraint = new Map();
  for (const row of rows) {
    if (!byConstraint.has(row.constraint_name)) {
      byConstraint.set(row.constraint_name, {
        constraint: row.constraint_name,
        table: row.table_name,
        parentTable: row.parent_table,
        columns: [],
      });
    }
    byConstraint.get(row.constraint_name).columns.push({
      column: row.column_name,
      parentColumn: row.parent_column,
    });
  }
  return [...byConstraint.values()];
};

export const readTargetRowCounts = async (client, tableNames) => {
  if (!tableNames.length) return {};
  const { rows } = await client.query(
    `SELECT relname AS table_name, n_live_tup AS estimate FROM pg_stat_user_tables WHERE relname = ANY($1::text[])`,
    [tableNames]
  );
  const counts = {};
  for (const row of rows) counts[row.table_name] = Number(row.estimate);
  return counts;
};

export const readTargetExactRowCounts = async (client, tableNames, { schema = 'public' } = {}) => {
  const counts = {};
  for (const name of tableNames) {
    const { rows } = await client.query(
      `SELECT COUNT(*)::bigint AS count FROM ${qualify(name, schema)}`
    );
    counts[name] = Number(rows[0].count);
  }
  return counts;
};

export const truncateTables = async (client, tableNames, { schema = 'public' } = {}) => {
  if (!tableNames.length) return;
  const list = tableNames
    .map((name) => `TRUNCATE TABLE ${qualify(name, schema)} RESTART IDENTITY CASCADE`)
    .join('; ');
  await client.query(list);
};

export const analyzeTables = async (client, tableNames, { schema = 'public' } = {}) => {
  for (const name of tableNames) {
    await client.query(`ANALYZE ${qualify(name, schema)}`);
  }
};

export const findOrphanRows = async (client, foreignKeys, { schema = 'public' } = {}) => {
  const orphans = [];
  for (const fk of foreignKeys) {
    const conditions = fk.columns
      .map(({ column, parentColumn }) => `c.${quote(column)} = p.${quote(parentColumn)}`)
      .join(' AND ');
    const { rows } = await client.query(
      `SELECT COUNT(*)::bigint AS count
       FROM ${qualify(fk.table, schema)} c
       LEFT JOIN ${qualify(fk.parentTable, schema)} p ON ${conditions}
       WHERE c.${quote(fk.columns[0].column)} IS NOT NULL AND p.${quote(fk.columns[0].parentColumn)} IS NULL`
    );
    if (Number(rows[0].count) > 0) orphans.push({ table: fk.table, count: Number(rows[0].count) });
  }
  return orphans;
};

export const readNumericSums = async (client, checks, { schema = 'public' } = {}) => {
  const sums = {};
  for (const { table, column } of checks) {
    const { rows } = await client.query(
      `SELECT COALESCE(SUM(${quote(column)}), 0)::numeric AS total, COUNT(*)::bigint AS rows
       FROM ${qualify(table, schema)}`
    );
    sums[`${table}.${column}`] = { total: rows[0].total, rows: Number(rows[0].rows) };
  }
  return sums;
};

export const createQuarantineTable = async (client, { schema = 'public' } = {}) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${qualify('migration_quarantine', schema)} (
      id BIGSERIAL PRIMARY KEY,
      source_table TEXT NOT NULL,
      source_key TEXT,
      reason TEXT NOT NULL,
      row JSONB NOT NULL,
      captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const saveQuarantineRows = async (client, rows, { schema = 'public' } = {}) => {
  if (!rows.length) return;
  for (const entry of rows) {
    await client.query(
      `INSERT INTO ${qualify('migration_quarantine', schema)} (source_table, source_key, reason, row) VALUES ($1, $2, $3, $4)`,
      [entry.sourceTable, entry.sourceKey, entry.reason, JSON.stringify(entry.row)]
    );
  }
};

export { quote as quoteIdentifier };
