import { describe, expect, it } from 'vitest';
import { buildPlan, orderTables } from '../lib/planner.js';

const sourceTable = (name, columns) => ({
  name,
  columns: columns.map((column) => ({
    name: column.name,
    dataType: column.dataType || 'nvarchar',
    length: column.length === undefined ? null : column.length,
    isNullable: column.isNullable !== false,
    isIdentity: false,
    isComputed: false,
    isRowVersion: false,
    hasDefault: Boolean(column.hasDefault),
  })),
});

const targetTable = (name, columns) => ({
  name,
  columns: columns.map((column) => ({
    name: column.name,
    dataType: column.dataType || 'text',
    type: column.type || column.dataType || 'text',
    maxLength: column.maxLength === undefined ? null : column.maxLength,
    isNullable: column.isNullable !== false,
    hasDefault: Boolean(column.hasDefault),
    isIdentity: Boolean(column.isIdentity),
    isArray: Boolean(column.isArray),
  })),
});

describe('copy ordering', () => {
  it('copies parents before children', () => {
    const { order, cycles } = orderTables(['sales', 'sale_items', 'businesses'], [
      { table: 'sale_items', parentTable: 'sales' },
      { table: 'sales', parentTable: 'businesses' },
    ]);

    expect(cycles).toEqual([]);
    expect(order.indexOf('businesses')).toBeLessThan(order.indexOf('sales'));
    expect(order.indexOf('sales')).toBeLessThan(order.indexOf('sale_items'));
  });

  it('ignores dependencies on tables that are not being copied', () => {
    const { order } = orderTables(['sale_items'], [{ table: 'sale_items', parentTable: 'sales' }]);
    expect(order).toEqual(['sale_items']);
  });

  it('keeps every table and flags cycles when dependencies loop', () => {
    const { order, cycles } = orderTables(['a', 'b', 'c'], [
      { table: 'a', parentTable: 'b' },
      { table: 'b', parentTable: 'a' },
      { table: 'c', parentTable: 'a' },
    ]);

    expect(order.sort()).toEqual(['a', 'b', 'c']);
    expect(cycles.length).toBe(1);
  });
});

describe('buildPlan', () => {
  it('maps the legacy schema onto PostgreSQL types', () => {
    const plan = buildPlan({
      source: {
        tables: [
          sourceTable('businesses', [
            { name: 'id', dataType: 'uniqueidentifier', isNullable: false, hasDefault: true },
            { name: 'name', dataType: 'nvarchar', length: '255' },
            { name: 'created_at', dataType: 'datetime2', isNullable: false, hasDefault: true },
          ]),
          sourceTable('sales', [
            { name: 'id', dataType: 'uniqueidentifier', isNullable: false, hasDefault: true },
            { name: 'total', dataType: 'decimal', length: '12,2', isNullable: false },
          ]),
        ],
      },
      target: {
        tables: [
          targetTable('businesses', [
            { name: 'id', dataType: 'uuid', type: 'uuid', isNullable: false },
            { name: 'name', dataType: 'varchar', type: 'character varying(255)', maxLength: 255 },
            { name: 'created_at', dataType: 'timestamp', type: 'timestamp without time zone' },
          ]),
          targetTable('sales', [
            { name: 'id', dataType: 'uuid', type: 'uuid', isNullable: false },
            { name: 'total', dataType: 'numeric', type: 'numeric(12,2)', isNullable: false },
          ]),
        ],
      },
      foreignKeys: [
        { table: 'sales', parentTable: 'businesses', columns: [{ column: 'business_id', parentColumn: 'id' }] },
      ],
    });

    expect(plan.order).toEqual(['businesses', 'sales']);
    expect(plan.warnings).toEqual([]);
    expect(plan.skippedColumns).toEqual([]);

    const byName = Object.fromEntries(plan.tables.map((table) => [table.name, table]));
    expect(
      byName.businesses.columns.map((column) => [column.sourceName, column.targetName, column.cast])
    ).toEqual([
      ['id', 'id', 'uuid'],
      ['name', 'name', null],
      ['created_at', 'created_at', 'timestamp without time zone'],
    ]);
    expect(byName.sales.columns[1]).toMatchObject({
      sourceName: 'total',
      targetName: 'total',
      strategy: 'numeric',
      cast: 'numeric',
    });
  });

  it('converts json text into jsonb and ip whitelists into inet arrays', () => {
    const plan = buildPlan({
      source: {
        tables: [
          sourceTable('api_keys', [
            { name: 'scopes', dataType: 'nvarchar', length: 'max' },
            { name: 'ip_whitelist', dataType: 'nvarchar', length: 'max' },
          ]),
        ],
      },
      target: {
        tables: [
          targetTable('api_keys', [
            { name: 'scopes', dataType: 'jsonb', type: 'jsonb' },
            { name: 'ip_whitelist', dataType: 'ARRAY', type: 'inet[]', isArray: true },
          ]),
        ],
      },
      foreignKeys: [],
    });

    const [apiKeys] = plan.tables;
    expect(apiKeys.columns.find((column) => column.targetName === 'scopes')).toMatchObject({
      cast: 'jsonb',
      valueStrategy: 'json-text',
    });
    expect(apiKeys.columns.find((column) => column.targetName === 'ip_whitelist')).toMatchObject({
      cast: 'inet[]',
      valueStrategy: 'inet-array',
    });
  });

  it('drops legacy columns that no longer exist', () => {
    const plan = buildPlan({
      source: {
        tables: [
          sourceTable('sales', [
            { name: 'id', dataType: 'uniqueidentifier' },
            { name: 'legacy_code', dataType: 'nvarchar', length: '20' },
            { name: 'row_version', dataType: 'timestamp' },
          ]),
        ],
      },
      target: {
        tables: [
          targetTable('sales', [
            { name: 'id', dataType: 'uuid', type: 'uuid' },
            { name: 'total', dataType: 'numeric', type: 'numeric(12,2)', hasDefault: true },
          ]),
        ],
      },
      foreignKeys: [],
    });

    const [sales] = plan.tables;
    expect(sales.columns.map((column) => column.targetName)).toEqual(['id']);
    expect(plan.skippedColumns).toEqual([
      { table: 'sales', name: 'legacy_code', reason: 'no matching target column' },
      {
        table: 'sales',
        name: 'row_version',
        reason: 'SQL Server rowversion is generated by the engine and has no PostgreSQL equivalent',
      },
    ]);
  });

  it('warns when a text column is wider than the target column', () => {
    const plan = buildPlan({
      source: { tables: [sourceTable('users', [{ name: 'email', dataType: 'nvarchar', length: 'max' }])] },
      target: {
        tables: [targetTable('users', [{ name: 'email', dataType: 'varchar', maxLength: 120 }])],
      },
      foreignKeys: [],
    });

    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('may be truncated');
  });

  it('warns about required target columns that will not be populated', () => {
    const plan = buildPlan({
      source: { tables: [sourceTable('sales', [{ name: 'id', dataType: 'uniqueidentifier' }])] },
      target: {
        tables: [
          targetTable('sales', [
            { name: 'id', dataType: 'uuid', type: 'uuid' },
            { name: 'required_flag', dataType: 'boolean', type: 'boolean', isNullable: false },
          ]),
        ],
      },
      foreignKeys: [],
    });

    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('required_flag');
  });

  it('reports tables that only exist on one side', () => {
    const plan = buildPlan({
      source: { tables: [sourceTable('legacy_only', [{ name: 'id' }])] },
      target: {
        tables: [targetTable('new_only', [{ name: 'id', dataType: 'uuid', type: 'uuid' }])],
      },
      foreignKeys: [],
    });

    expect(plan.onlyInSource).toEqual(['legacy_only']);
    expect(plan.onlyInTarget).toEqual(['new_only']);
    expect(plan.order).toEqual([]);
    expect(plan.tables[0]).toMatchObject({ presentInTarget: false, columns: [] });
  });
});
