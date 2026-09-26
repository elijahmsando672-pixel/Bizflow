import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildSourceMetadata, parseTsqlSchema } from '../lib/tsql.js';

const legacySchema = fs.readFileSync(
  path.resolve(process.cwd(), 'fixtures/legacy-schema.tsql.js'),
  'utf8'
);

const metadata = buildSourceMetadata(legacySchema);
const tableNamed = (name) => metadata.tables.find((table) => table.name === name);

describe('legacy T-SQL schema parsing', () => {
  it('extracts every table and column from the recovered schema', () => {
    expect(metadata.tables).toHaveLength(66);
    const columnCount = metadata.tables.reduce((total, table) => total + table.columns.length, 0);
    expect(columnCount).toBe(700);
  });

  it('reads uniqueidentifier keys with their default', () => {
    const businesses = tableNamed('businesses');
    const id = businesses.columns.find((column) => column.name === 'id');

    expect(id.dataType).toBe('uniqueidentifier');
    expect(id.isNullable).toBe(false);
    expect(id.isPrimaryKey).toBe(true);
    expect(id.hasDefault).toBe(true);
  });

  it('captures nvarchar lengths and max lengths', () => {
    const apiKeys = tableNamed('api_keys');
    const name = apiKeys.columns.find((column) => column.name === 'name');
    const scopes = apiKeys.columns.find((column) => column.name === 'scopes');

    expect(name.dataType).toBe('nvarchar');
    expect(name.length).toBe('100');
    expect(scopes.length).toBe('max');
  });

  it('captures decimal precision and money columns', () => {
    const amount = tableNamed('expenses').columns.find((column) => column.name === 'amount');
    const subtotal = tableNamed('invoices').columns.find((column) => column.name === 'subtotal');

    expect(amount.dataType).toBe('decimal');
    expect(amount.length).toBe('12,2');
    expect(amount.isNullable).toBe(false);
    expect(subtotal.dataType).toBe('decimal');
  });

  it('does not mistake DEFAULT CAST(... AS DATE) for a computed column', () => {
    const computed = metadata.tables.flatMap((table) =>
      table.columns.filter((column) => column.isComputed).map((column) => `${table.name}.${column.name}`)
    );
    expect(computed).toEqual([]);
  });

  it('ignores table level constraints', () => {
    const businesses = parseTsqlSchema(legacySchema).find((table) => table.name === 'businesses');
    expect(businesses.columns.map((column) => column.name)).not.toContain('CONSTRAINT');
  });
});
