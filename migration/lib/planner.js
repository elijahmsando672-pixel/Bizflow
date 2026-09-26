import { getReadStrategy, getSourceStrategy, getTargetCast } from './types.js';

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const indexByName = (columns) => {
  const byExact = new Map();
  const byNormalized = new Map();
  for (const column of columns) {
    byExact.set(column.name.toLowerCase(), column);
    const key = normalize(column.name);
    if (!byNormalized.has(key)) byNormalized.set(key, []);
    byNormalized.get(key).push(column);
  }
  return { byExact, byNormalized };
};

const matchColumn = (sourceColumn, targetIndex) => {
  const exact = targetIndex.byExact.get(sourceColumn.name.toLowerCase());
  if (exact) return { target: exact, via: 'exact' };

  const candidates = targetIndex.byNormalized.get(normalize(sourceColumn.name)) || [];
  if (candidates.length === 1) return { target: candidates[0], via: 'normalized' };
  if (candidates.length > 1) {
    return { target: null, via: 'ambiguous', candidates: candidates.map((c) => c.name) };
  }
  return { target: null, via: 'missing' };
};

const TEXT_TYPES = new Set(['text', 'varchar', 'char']);

const sourceMaxLength = (sourceColumn) => {
  if (sourceColumn.length === null || sourceColumn.length === undefined) return null;
  if (String(sourceColumn.length).toLowerCase() === 'max') return Infinity;
  const parsed = Number.parseInt(String(sourceColumn.length), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const planTable = (sourceTable, targetTable) => {
  const warnings = [];
  const skipped = [];
  const columns = [];

  if (!targetTable) {
    return {
      name: sourceTable.name,
      presentInTarget: false,
      columns: [],
      skippedColumns: sourceTable.columns.map((column) => ({
        name: column.name,
        reason: 'table missing in target',
      })),
      warnings: ['table has no PostgreSQL counterpart'],
    };
  }

  const targetIndex = indexByName(targetTable.columns);

  for (const sourceColumn of sourceTable.columns) {
    const { strategy, reason: skipReason } = getSourceStrategy(sourceColumn);
    if (strategy === 'skip') {
      skipped.push({ name: sourceColumn.name, reason: skipReason });
      continue;
    }
    if (skipReason) {
      warnings.push(`column ${sourceColumn.name}: ${skipReason}`);
    }

    const match = matchColumn(sourceColumn, targetIndex);
    if (!match.target) {
      skipped.push({
        name: sourceColumn.name,
        reason:
          match.via === 'ambiguous'
            ? `ambiguous target match (${match.candidates.join(', ')})`
            : 'no matching target column',
      });
      if (match.via === 'ambiguous') {
        warnings.push(
          `column ${sourceColumn.name} matches multiple target columns: ${match.candidates.join(', ')}`
        );
      }
      continue;
    }

    const { cast, valueStrategy, reason: castReason } = getTargetCast(match.target, strategy);
    if (castReason) {
      warnings.push(`column ${sourceColumn.name} -> ${match.target.name}: ${castReason}`);
    }
    if (match.via === 'normalized') {
      warnings.push(
        `column ${sourceColumn.name} matched ${match.target.name} by normalized name, verify mapping`
      );
    }
    if (strategy === 'text' && TEXT_TYPES.has(match.target.dataType)) {
      const max = sourceMaxLength(sourceColumn);
      if (max !== null && match.target.maxLength !== null && max > match.target.maxLength) {
        warnings.push(
          `column ${sourceColumn.name} may be truncated: SQL Server length ${max} exceeds target ${match.target.name}(${match.target.maxLength})`
        );
      }
    }

    columns.push({
      sourceName: sourceColumn.name,
      targetName: match.target.name,
      strategy,
      valueStrategy: valueStrategy || strategy,
      readStrategy: getReadStrategy(strategy),
      cast,
      matchedBy: match.via,
    });
  }

  const copied = new Set(columns.map((column) => column.targetName.toLowerCase()));
  for (const targetColumn of targetTable.columns) {
    if (copied.has(targetColumn.name.toLowerCase())) continue;
    if (!targetColumn.isNullable && !targetColumn.hasDefault && !targetColumn.isIdentity) {
      warnings.push(
        `target column ${targetColumn.name} is NOT NULL without a default and will not be populated`
      );
    }
  }

  return {
    name: sourceTable.name,
    presentInTarget: true,
    columns,
    skippedColumns: skipped,
    warnings,
  };
};

export const orderTables = (tableNames, foreignKeys) => {
  const included = new Set(tableNames);
  const dependencies = new Map(tableNames.map((name) => [name, new Set()]));

  for (const fk of foreignKeys) {
    if (!included.has(fk.table) || !included.has(fk.parentTable)) continue;
    if (fk.table === fk.parentTable) continue;
    dependencies.get(fk.table).add(fk.parentTable);
  }

  const ordered = [];
  const remaining = new Set(tableNames);
  const cycles = [];

  while (remaining.size) {
    const ready = [...remaining].filter((name) =>
      [...dependencies.get(name)].every((dependency) => !remaining.has(dependency))
    );

    if (!ready.length) {
      cycles.push([...remaining]);
      ordered.push(...remaining);
      break;
    }

    ready.sort();
    for (const name of ready) {
      ordered.push(name);
      remaining.delete(name);
    }
  }

  return { order: ordered, cycles };
};

export const buildPlan = ({ source, target, foreignKeys = [] }) => {
  const targetByName = new Map(target.tables.map((table) => [table.name.toLowerCase(), table]));
  const sourceByName = new Map(source.tables.map((table) => [table.name.toLowerCase(), table]));

  const tables = source.tables.map((sourceTable) =>
    planTable(sourceTable, targetByName.get(sourceTable.name.toLowerCase()))
  );

  const onlyInSource = source.tables
    .filter((table) => !targetByName.has(table.name.toLowerCase()))
    .map((table) => table.name);

  const onlyInTarget = target.tables
    .filter((table) => !sourceByName.has(table.name.toLowerCase()))
    .map((table) => table.name);

  const copyable = tables.filter((table) => table.presentInTarget).map((table) => table.name);
  const { order, cycles } = orderTables(copyable, foreignKeys);

  const warnings = [];
  for (const table of tables) {
    for (const warning of table.warnings) warnings.push(`${table.name}: ${warning}`);
  }
  for (const cycle of cycles) warnings.push(`foreign key cycle, order is best effort: ${cycle.join(' -> ')}`);

  return {
    tables,
    order,
    cycles,
    onlyInSource,
    onlyInTarget,
    skippedColumns: tables.flatMap((table) =>
      table.skippedColumns.map((column) => ({ table: table.name, ...column }))
    ),
    warnings,
  };
};
