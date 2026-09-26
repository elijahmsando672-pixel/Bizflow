import sql from 'mssql';

const SKIP_TABLES = new Set(['sysdiagrams', 'dtproperties', 'schema_migrations']);

const quote = (identifier) => `[${identifier.replace(/]/g, ']]')}]`;

const readSourceColumn = (row) => ({
  name: row.COLUMN_NAME,
  dataType: String(row.DATA_TYPE).toLowerCase(),
  length:
    row.CHARACTER_MAXIMUM_LENGTH === null || row.CHARACTER_MAXIMUM_LENGTH === undefined
      ? null
      : String(row.CHARACTER_MAXIMUM_LENGTH),
  isNullable: row.IS_NULLABLE === 'YES',
  isIdentity: row.IS_IDENTITY === 1 || row.IS_IDENTITY === '1',
  isComputed: row.IS_COMPUTED === 1 || row.IS_COMPUTED === '1',
  isRowVersion: row.IS_ROWVERSION === 1 || row.IS_ROWVERSION === '1',
  isPrimaryKey: false,
  hasDefault: row.COLUMN_DEFAULT !== null && row.COLUMN_DEFAULT !== undefined,
});

export const connectSqlServer = async (connectionString) => {
  const pool = new sql.ConnectionPool(connectionString);
  await pool.connect();
  return pool;
};

export const readSourceMetadata = async (pool, { schema = 'dbo', tables } = {}) => {
  const request = pool.request();
  request.input('schemaName', sql.NVarChar, schema);

  const result = await request.query(`
    SELECT
      t.name AS table_name,
      c.name AS column_name,
      ty.name AS data_type,
      c.max_length AS character_maximum_length,
      c.is_nullable,
      c.is_identity,
      c.is_computed,
      c.is_rowversion,
      c.column_default
    FROM sys.tables t
    JOIN sys.columns c ON c.object_id = t.object_id
    JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    WHERE SCHEMA_NAME(t.schema_id) = @schemaName
      AND t.is_ms_shipped = 0
    ORDER BY t.name, c.column_id
  `);

  const byTable = new Map();
  for (const row of result.recordset) {
    const name = row.table_name;
    if (SKIP_TABLES.has(name) || SKIP_TABLES.has(name.toLowerCase())) continue;
    if (tables && !tables.includes(name)) continue;
    if (!byTable.has(name)) byTable.set(name, { name, columns: [] });
    byTable.get(name).columns.push(readSourceColumn(row));
  }

  return { dialect: 'sqlserver', schema, tables: [...byTable.values()] };
};

export const readSourcePrimaryKeys = async (pool, { schema = 'dbo' } = {}) => {
  const request = pool.request();
  request.input('schemaName', sql.NVarChar, schema);

  const result = await request.query(`
    SELECT t.name AS table_name, c.name AS column_name, ic.key_ordinal
    FROM sys.tables t
    JOIN sys.indexes i ON i.object_id = t.object_id AND i.is_primary_key = 1
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE SCHEMA_NAME(t.schema_id) = @schemaName
    ORDER BY t.name, ic.key_ordinal
  `);

  const keys = {};
  for (const row of result.recordset) {
    if (!keys[row.table_name]) keys[row.table_name] = [];
    keys[row.table_name].push(row.column_name);
  }
  return keys;
};

export const readSourceRowCounts = async (pool, tableNames) => {
  const request = pool.request();
  for (const name of tableNames) request.input(`t_${name}`, sql.NVarChar, name);
  const list = tableNames.map((name) => `@t_${name}`).join(', ');
  const result = await request.query(`SELECT ${list}`);
  const counts = {};
  for (const row of result.recordset) {
    for (const name of tableNames) {
      if (row[`t_${name}`] != null) counts[name] = row[`t_${name}`];
    }
  }
  return counts;
};

export const buildSelectList = (columns) =>
  columns
    .map((column) => {
      const name = column.sourceName || column.name;
      const expression =
        column.readStrategy === 'numeric-text'
          ? `CAST(${quote(name)} AS NVARCHAR(128))`
          : quote(name);
      return `${expression} AS ${quote(name)}`;
    })
    .join(', ');

export const buildKeysetSelect = ({ table, columns, batchSize, keyColumns, lastKey }) => {
  const selectList = buildSelectList(columns);

  if (keyColumns && keyColumns.length) {
    const orderBy = keyColumns.map((name) => quote(name)).join(', ');
    const predicate = lastKey
      ? ` WHERE (${orderBy}) > (${lastKey.map((_, index) => `@key${index}`).join(', ')})`
      : '';
    return {
      text: `SELECT TOP (${Number(batchSize)}) ${selectList} FROM ${quote(table)}${predicate} ORDER BY ${orderBy}`,
      inputs: lastKey ? Object.fromEntries(lastKey.map((value, index) => [`key${index}`, value])) : {},
    };
  }

  const offset = lastKey ? Number(lastKey) : 0;
  return {
    text: `SELECT ${selectList} FROM ${quote(table)} ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${Number(
      batchSize
    )} ROWS ONLY`,
    inputs: {},
    nextOffset: offset + batchSize,
  };
};

export const readRows = async (pool, { text, inputs }) => {
  const request = pool.request();
  for (const [key, value] of Object.entries(inputs || {})) {
    request.input(key, sql.NVarChar(4000), value);
  }
  const result = await request.query(text);
  return result.recordset;
};
