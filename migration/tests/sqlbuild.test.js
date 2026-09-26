import { describe, expect, it } from 'vitest';
import { buildInsertStatement, chunk, rowsPerStatement } from '../lib/sqlbuild.js';

const columns = (count) =>
  Array.from({ length: count }, (unused, index) => ({
    sourceName: `c${index}`,
    targetName: `c${index}`,
    cast: null,
  }));

describe('rowsPerStatement', () => {
  it('caps the batch so wide rows stay inside the parameter budget', () => {
    expect(rowsPerStatement(59, 2000)).toBe(1092);
    expect(rowsPerStatement(100000, 1000)).toBe(1);
  });

  it('never exceeds the requested batch size', () => {
    expect(rowsPerStatement(1, 250)).toBe(250);
  });

  it('keeps single column tables at the requested batch size', () => {
    expect(rowsPerStatement(1, 1000)).toBe(1000);
  });
});

describe('chunk', () => {
  it('splits rows into batches', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles empty input', () => {
    expect(chunk([], 10)).toEqual([]);
  });
});

describe('buildInsertStatement', () => {
  it('quotes identifiers and numbers the placeholders', () => {
    const statement = buildInsertStatement(
      'sale items',
      [
        { targetName: 'id', cast: 'uuid' },
        { targetName: 'total', cast: 'numeric' },
      ],
      [['a', 1]]
    );

    expect(statement.sql).toBe('INSERT INTO "sale items" ("id", "total") VALUES ($1::uuid, $2::numeric)');
    expect(statement.values).toEqual(['a', 1]);
  });

  it('qualifies the table when a schema is given', () => {
    const statement = buildInsertStatement('t', [{ targetName: 'a' }], [['x']], { schema: 'staging' });
    expect(statement.sql).toBe('INSERT INTO "staging"."t" ("a") VALUES ($1)');
  });

  it('emits one tuple per row with sequential placeholders', () => {
    const statement = buildInsertStatement('t', columns(3), [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    expect(statement.sql).toBe(
      'INSERT INTO "t" ("c0", "c1", "c2") VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)'
    );
    expect(statement.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('keeps the values aligned with the placeholders', () => {
    const statement = buildInsertStatement('t', columns(2), [
      ['a', 'b'],
      ['c', 'd'],
    ]);

    const placeholders = statement.sql.match(/\$(\d+)/g).length;
    expect(placeholders).toBe(statement.values.length);
  });

  it('escapes embedded quotes in identifiers', () => {
    const statement = buildInsertStatement('we"ird', [{ targetName: 'a"b' }], [['x']]);
    expect(statement.sql).toBe('INSERT INTO "we""ird" ("a""b") VALUES ($1)');
  });

  it('returns null when there is nothing to insert', () => {
    expect(buildInsertStatement('t', columns(1), [])).toBeNull();
  });
});
