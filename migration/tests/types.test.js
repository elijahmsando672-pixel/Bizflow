import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatNaiveTimestamp,
  getReadStrategy,
  getSourceStrategy,
  getTargetCast,
  toMigrationValue,
} from '../lib/types.js';

const sourceColumn = (overrides = {}) => ({
  name: 'column',
  dataType: 'nvarchar',
  length: null,
  isNullable: true,
  isIdentity: false,
  isComputed: false,
  isRowVersion: false,
  hasDefault: false,
  ...overrides,
});

const targetColumn = (overrides = {}) => ({
  name: 'column',
  dataType: 'text',
  type: 'text',
  maxLength: null,
  isNullable: true,
  hasDefault: false,
  isIdentity: false,
  isArray: false,
  ...overrides,
});

describe('source type strategies', () => {
  it('maps the SQL Server types used by BizFlow', () => {
    expect(getSourceStrategy(sourceColumn({ dataType: 'uniqueidentifier' })).strategy).toBe('uuid');
    expect(getSourceStrategy(sourceColumn({ dataType: 'nvarchar', length: '255' })).strategy).toBe('text');
    expect(getSourceStrategy(sourceColumn({ dataType: 'bit' })).strategy).toBe('boolean');
    expect(getSourceStrategy(sourceColumn({ dataType: 'decimal' })).strategy).toBe('numeric');
    expect(getSourceStrategy(sourceColumn({ dataType: 'datetime2' })).strategy).toBe('timestamp');
    expect(getSourceStrategy(sourceColumn({ dataType: 'date' })).strategy).toBe('date');
    expect(getSourceStrategy(sourceColumn({ dataType: 'datetimeoffset' })).strategy).toBe('timestamptz');
  });

  it('reads high precision numerics as text to avoid float rounding', () => {
    expect(getReadStrategy('numeric')).toBe('numeric-text');
    expect(getReadStrategy('uuid')).toBe('native');
  });

  it('skips computed and rowversion columns', () => {
    expect(getSourceStrategy(sourceColumn({ isComputed: true })).strategy).toBe('skip');
    expect(getSourceStrategy(sourceColumn({ dataType: 'rowversion' })).strategy).toBe('skip');
    expect(getSourceStrategy(sourceColumn({ isRowVersion: true })).strategy).toBe('skip');
  });

  it('skips rowversion and sql_variant columns', () => {
    expect(getSourceStrategy(sourceColumn({ dataType: 'timestamp' })).strategy).toBe('skip');
    expect(getSourceStrategy(sourceColumn({ dataType: 'rowversion' })).strategy).toBe('skip');
    expect(getSourceStrategy(sourceColumn({ isRowVersion: true })).strategy).toBe('skip');
    expect(getSourceStrategy(sourceColumn({ dataType: 'sql_variant' })).strategy).toBe('skip');
  });

  it('skips unknown types instead of guessing', () => {
    const result = getSourceStrategy(sourceColumn({ dataType: 'dbversion' }));
    expect(result.strategy).toBe('skip');
    expect(result.reason).toContain('dbversion');
  });

  it('flags types that are copied as text and need review', () => {
    const result = getSourceStrategy(sourceColumn({ dataType: 'xml' }));
    expect(result.strategy).toBe('text');
    expect(result.reason).toContain('xml');
  });
});

describe('target casts', () => {
  it('casts json text into jsonb', () => {
    const result = getTargetCast(targetColumn({ dataType: 'jsonb', type: 'jsonb' }), 'text');
    expect(result.cast).toBe('jsonb');
    expect(result.valueStrategy).toBe('json-text');
  });

  it('casts json text into inet arrays', () => {
    const result = getTargetCast(targetColumn({ dataType: 'ARRAY', type: 'inet[]', isArray: true }), 'text');
    expect(result.cast).toBe('inet[]');
    expect(result.valueStrategy).toBe('inet-array');
  });

  it('does not cast plain text columns', () => {
    expect(getTargetCast(targetColumn(), 'text').cast).toBeNull();
    expect(getTargetCast(targetColumn({ dataType: 'varchar', type: 'character varying(255)' }), 'text').cast).toBeNull();
    expect(getTargetCast(targetColumn({ dataType: 'char', type: 'character(2)' }), 'text').reason).toBeNull();
  });

  it('casts text into uuid, inet and boolean targets', () => {
    expect(getTargetCast(targetColumn({ dataType: 'uuid', type: 'uuid' }), 'text').cast).toBe('uuid');
    expect(getTargetCast(targetColumn({ dataType: 'inet', type: 'inet' }), 'text').cast).toBe('inet');
  });

  it('reports target types that have no mapping instead of guessing', () => {
    const result = getTargetCast(targetColumn({ dataType: 'geometry', type: 'geometry' }), 'text');
    expect(result.cast).toBeNull();
    expect(result.reason).toContain('geometry');
  });
});

describe('value conversion', () => {
  it('keeps naive timestamps free of timezone shifts', () => {
    const value = new Date(2026, 2, 4, 15, 30, 5, 120);
    expect(formatNaiveTimestamp(value)).toBe('2026-03-04 15:30:05.120');
    expect(toMigrationValue('timestamp', value)).toBe('2026-03-04 15:30:05.120');
  });

  it('formats dates without a time component', () => {
    expect(formatDate(new Date(2026, 0, 9))).toBe('2026-01-09');
    expect(formatDate('2026-01-09T00:00:00.000Z')).toBe('2026-01-09');
  });

  it('converts offsets to absolute instants', () => {
    expect(toMigrationValue('timestamptz', new Date(Date.UTC(2026, 0, 1, 12)))).toBe(
      '2026-01-01T12:00:00.000Z'
    );
  });

  it('converts bit columns to booleans', () => {
    expect(toMigrationValue('boolean', true)).toBe(true);
    expect(toMigrationValue('boolean', 1)).toBe(true);
    expect(toMigrationValue('boolean', 0)).toBe(false);
  });

  it('turns empty json text into null so casts never fail', () => {
    expect(toMigrationValue('json-text', '')).toBeNull();
    expect(toMigrationValue('json-text', '  ')).toBeNull();
    expect(toMigrationValue('json-text', '["read"]')).toBe('["read"]');
  });

  it('builds a PostgreSQL array literal from an ip whitelist', () => {
    expect(toMigrationValue('inet-array', '["10.0.0.1","10.0.0.2"]')).toBe('{"10.0.0.1","10.0.0.2"}');
    expect(toMigrationValue('inet-array', '[]')).toBe('{}');
    expect(toMigrationValue('inet-array', ['10.0.0.3'])).toBe('{"10.0.0.3"}');
    expect(toMigrationValue('inet-array', '')).toBe('{}');
  });

  it('fails loudly on a malformed ip whitelist', () => {
    expect(() => toMigrationValue('inet-array', '10.0.0.1')).toThrow();
  });

  it('preserves nulls, buffers and numeric text', () => {
    expect(toMigrationValue('uuid', null)).toBeNull();
    expect(toMigrationValue('uuid', undefined)).toBeNull();
    const buffer = Buffer.from([1, 2, 3]);
    expect(toMigrationValue('bytea', buffer)).toBe(buffer);
    expect(toMigrationValue('numeric', '12345678901234.56')).toBe('12345678901234.56');
  });
});
