const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT = /--[^\n]*/g;
const CREATE_TABLE = /CREATE\s+TABLE\s+(?:\[?[\w.]+\]?\.)?\[?([\w]+)\]?\s*\(/gi;

const stripComments = (sql) => sql.replace(BLOCK_COMMENT, ' ').replace(LINE_COMMENT, ' ');

const splitTopLevel = (body) => {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of body) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

const findClosingParen = (sql, openIndex) => {
  let depth = 0;
  let inString = false;
  for (let i = openIndex; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'") inString = !inString;
    if (inString) continue;
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
};

const unquote = (token) => token.trim().replace(/^\[|\]$/g, '').replace(/^"|"$/g, '');

const parseColumn = (definition) => {
  const match = definition.match(/^(\[?[\w]+\]?|"[^"]+")\s+([A-Za-z_][\w]*)\s*(\(([^)]*)\))?/);
  if (!match) return null;

  const name = unquote(match[1]);
  const dataType = match[2].toLowerCase();
  const args = (match[4] || '').trim();
  const rest = definition.slice(match[0].length);
  const normalized = rest.replace(/\s+/g, ' ').trim();

  const isComputed = /^AS\s/i.test(normalized);
  const hasDefault = /\bDEFAULT\b/i.test(normalized);
  const reference = normalized.match(/REFERENCES\s+(?:\[?[\w.]+\]?\.)?\[?(\w+)\]?\s*\(\s*\[?(\w+)\]?\s*\)/i);

  return {
    name,
    dataType,
    length: args ? args.toLowerCase() : null,
    notNullable: /\bNOT\s+NULL\b/i.test(normalized),
    isIdentity: /\bIDENTITY\b/i.test(normalized),
    isComputed,
    isRowVersion: /\bROWGUIDCOL\b/i.test(normalized) || dataType === 'rowversion',
    hasDefault,
    primaryKey: /\bPRIMARY\s+KEY\b/i.test(normalized),
    referenceTable: reference ? unquote(reference[1]) : null,
    referenceColumn: reference ? unquote(reference[2]) : null,
  };
};

export const parseTsqlSchema = (sql) => {
  const cleaned = stripComments(sql);
  const tables = [];
  let match;

  CREATE_TABLE.lastIndex = 0;
  while ((match = CREATE_TABLE.exec(cleaned)) !== null) {
    const openIndex = cleaned.indexOf('(', match.index + match[0].length - 1);
    const closeIndex = findClosingParen(cleaned, openIndex);
    if (closeIndex === -1) continue;

    const body = cleaned.slice(openIndex + 1, closeIndex);
    const columns = splitTopLevel(body)
      .filter((part) => !/^(CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK|INDEX|KEY)\b/i.test(part))
      .map(parseColumn)
      .filter(Boolean);

    tables.push({ name: unquote(match[1]), columns });
    CREATE_TABLE.lastIndex = closeIndex;
  }

  return tables;
};

export const buildSourceMetadata = (sql) => {
  const tables = parseTsqlSchema(sql);
  return {
    dialect: 'sqlserver',
    tables: tables.map((table) => ({
      name: table.name,
      columns: table.columns.map((column) => ({
        name: column.name,
        dataType: column.dataType,
        length: column.length,
        isNullable: !(column.notNullable || column.primaryKey),
        isIdentity: column.isIdentity,
        isComputed: column.isComputed,
        isRowVersion: column.isRowVersion,
        isPrimaryKey: column.primaryKey,
        hasDefault: column.hasDefault,
      })),
    })),
  };
};
