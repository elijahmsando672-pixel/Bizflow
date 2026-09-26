const quote = (identifier) => `"${identifier.replace(/"/g, '""')}"`;

const PG_MAX_PARAMETERS = 65535;
export const rowsPerStatement = (columnCount, requestedBatchSize) => {
  if (columnCount <= 0) return requestedBatchSize;
  const perParameter = columnCount + 1;
  return Math.max(1, Math.min(requestedBatchSize, Math.floor(PG_MAX_PARAMETERS / perParameter)));
};

export const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export const buildInsertStatement = (tableName, columns, rows, { schema } = {}) => {
  if (!rows.length) return null;

  const target = schema ? `${quote(schema)}.${quote(tableName)}` : quote(tableName);
  const columnList = columns.map((column) => quote(column.targetName)).join(', ');
  const values = [];

  let parameterIndex = 0;
  const tuples = rows.map((row) => {
    const placeholders = row
      .map((value, index) => {
        const column = columns[index];
        values.push(value);
        parameterIndex += 1;
        return column.cast ? `$${parameterIndex}::${column.cast}` : `$${parameterIndex}`;
      })
      .join(', ');
    return `(${placeholders})`;
  });

  return {
    sql: `INSERT INTO ${target} (${columnList}) VALUES ${tuples.join(', ')}`,
    values,
  };
};
