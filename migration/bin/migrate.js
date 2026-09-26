import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { buildPlan } from '../lib/planner.js';
import { buildInsertStatement, chunk, rowsPerStatement } from '../lib/sqlbuild.js';
import {
  analyzeTables,
  connectPostgres,
  createQuarantineTable,
  findOrphanRows,
  readNumericSums,
  readTargetExactRowCounts,
  readTargetForeignKeys,
  readTargetMetadata,
  saveQuarantineRows,
  truncateTables,
} from '../lib/postgres.js';
import {
  buildKeysetSelect,
  connectSqlServer,
  readRows,
  readSourceMetadata,
  readSourcePrimaryKeys,
  readSourceRowCounts,
} from '../lib/sqlserver.js';
import { toMigrationValue } from '../lib/types.js';

const BIN_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(BIN_DIR, '..', 'reports');
const ROOT_DIR = path.resolve(BIN_DIR, '..', '..');
const CHECK_COLUMNS = [
  'amount',
  'total',
  'subtotal',
  'tax_amount',
  'discount_amount',
  'balance',
  'total_paid',
  'amount_paid',
  'credit_limit',
];

const parseArgs = (argv) => {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const [flag, inlineValue] = token.slice(2).split('=');
    const next = argv[index + 1];
    if (inlineValue !== undefined) {
      args[flag] = inlineValue;
    } else if (next && !next.startsWith('--')) {
      args[flag] = next;
      index += 1;
    } else {
      args[flag] = true;
    }
  }
  return args;
};

const loadEnv = () => {
  dotenv.config({ path: path.join(ROOT_DIR, 'migration', '.env') });
  dotenv.config({ path: path.join(ROOT_DIR, '.env') });
  dotenv.config({ path: path.join(ROOT_DIR, 'server', '.env') });
};

const listArg = (value) =>
  typeof value === 'string' && value.trim() ? value.split(',').map((item) => item.trim()).filter(Boolean) : undefined;

const writeReport = (name, payload) => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const file = path.join(REPORT_DIR, `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
};

const printPlan = (plan) => {
  console.log('\nMigration plan');
  console.log('===============');
  console.log(`Tables copied: ${plan.order.length}`);

  const columnCount = plan.tables.reduce((total, table) => total + table.columns.length, 0);
  console.log(`Columns copied: ${columnCount}`);

  if (plan.onlyInSource.length) {
    console.log(`\nTables only in SQL Server (no PostgreSQL target): ${plan.onlyInSource.join(', ')}`);
  }
  if (plan.onlyInTarget.length) {
    console.log(`\nTables only in PostgreSQL (left empty): ${plan.onlyInTarget.join(', ')}`);
  }
  if (plan.skippedColumns.length) {
    console.log(`\nSkipped columns (${plan.skippedColumns.length}):`);
    for (const entry of plan.skippedColumns) {
      console.log(`  - ${entry.table}.${entry.name}: ${entry.reason}`);
    }
  }
  if (plan.warnings.length) {
    console.log(`\nWarnings (${plan.warnings.length}):`);
    for (const warning of plan.warnings) console.log(`  ! ${warning}`);
  }
  console.log('\nCopy order:');
  plan.order.forEach((name, index) => console.log(`  ${String(index + 1).padStart(3)}. ${name}`));
  console.log('');
};

const loadSourceMetadata = async (args, pool) => {
  if (args['source-metadata']) {
    return JSON.parse(fs.readFileSync(path.resolve(args['source-metadata']), 'utf8'));
  }
  if (!pool) throw new Error('SQLSERVER_URL is required unless --source-metadata is provided');
  return readSourceMetadata(pool, { schema: args.schema || 'dbo', tables: listArg(args.tables) });
};

const deriveChecks = (plan) => {
  const checks = [];
  for (const table of plan.tables) {
    for (const column of table.columns) {
      if (CHECK_COLUMNS.includes(column.targetName.toLowerCase()) && column.cast === 'numeric') {
        checks.push({ table: table.name, column: column.targetName });
      }
    }
  }
  return checks;
};

const copyTable = async ({ sourcePool, targetClient, table, planColumns, primaryKeys, args, stats, schema }) => {
  const batchSize = Number(args['batch-size'] || 1000);
  const perStatement = rowsPerStatement(planColumns.length, batchSize);
  let lastKey = null;
  let offset = 0;
  let copied = 0;
  const quarantined = [];

  for (;;) {
    const query = buildKeysetSelect({
      table: table.name,
      columns: planColumns,
      batchSize: perStatement,
      keyColumns: primaryKeys,
      lastKey,
    });

    const rows = await readRows(sourcePool, query);
    if (!rows.length) break;

    const hasKeyset = Boolean(primaryKeys && primaryKeys.length);
    if (!hasKeyset) {
      offset = query.nextOffset;
      lastKey = offset;
    }

    const converted = rows.map((row) =>
      planColumns.map((column) =>
        toMigrationValue(column.valueStrategy || column.strategy, row[column.sourceName])
      )
    );

    const insertBatches = chunk(converted, args['skip-bad-rows'] ? 1 : perStatement);

    for (const batch of insertBatches) {
      const statement = buildInsertStatement(table.name, planColumns, batch, { schema });
      try {
        await targetClient.query('BEGIN');
        await targetClient.query(statement.sql, statement.values);
        await targetClient.query('COMMIT');
        copied += batch.length;
      } catch (error) {
        await targetClient.query('ROLLBACK').catch(() => {});
        if (!args['skip-bad-rows']) {
          throw new Error(`${table.name}: ${error.message}`);
        }
        const row = rows[converted.indexOf(batch[0])] || {};
        quarantined.push({
          sourceTable: table.name,
          sourceKey: String(primaryKeys?.map((key) => row[key]).join('|') || ''),
          reason: error.message,
          row,
        });
      }
    }

    process.stdout.write(`\r  ${table.name}: ${copied} rows`);

    const exhausted = rows.length < perStatement;
    if (hasKeyset) {
      const last = rows[rows.length - 1];
      lastKey = primaryKeys.map((key) => last[key]);
    }
    if (exhausted) break;
  }

  process.stdout.write(`\r  ${table.name}: ${copied} rows\n`);
  stats.tables.push({ table: table.name, copied, quarantined: quarantined.length });
  await saveQuarantineRows(targetClient, quarantined, { schema });
};

const round2 = (value) => Math.round(Number(value) * 100) / 100;

const compareSums = (sourceSums, targetSums) => {
  const mismatches = [];
  for (const key of Object.keys(sourceSums)) {
    if (!targetSums[key]) {
      mismatches.push({ check: key, reason: 'missing in target' });
      continue;
    }
    const sourceTotal = round2(sourceSums[key].total);
    const targetTotal = round2(targetSums[key].total);
    if (sourceTotal !== targetTotal) {
      mismatches.push({ check: key, source: sourceTotal, target: targetTotal });
    }
  }
  return mismatches;
};

const validateCommand = (command, args, sourceUrl) => {
  const hasSource = Boolean(args['source-metadata'] || sourceUrl);

  if (command === 'migrate') {
    if (!args.yes) throw new Error('Refusing to migrate without --yes');
    if (!hasSource) throw new Error('SQLSERVER_URL or --source-metadata is required to migrate');
    if (args['skip-bad-rows'] && !args.quarantine) {
      throw new Error('--skip-bad-rows requires --quarantine so rejected rows are stored, not discarded');
    }
  }

  if (command === 'verify' && !hasSource) {
    throw new Error('SQLSERVER_URL is required to verify');
  }
};

export { copyTable, deriveChecks, compareSums, round2 };

const main = async () => {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!['plan', 'migrate', 'verify'].includes(command)) {
    console.error('Usage: node bin/migrate.js <plan|migrate|verify> [options]');
    console.error('  --source-metadata <file>  plan offline from a metadata JSON file');
    console.error('  --schema <name>          SQL Server schema (default dbo)');
    console.error('  --target-schema <name>   PostgreSQL schema (default public)');
    console.error('  --tables a,b             limit to specific tables');
    console.error('  --batch-size <n>         rows per statement (default 1000)');
    console.error('  --truncate               empty PostgreSQL tables before copying');
    console.error('  --skip-bad-rows          quarantine rows that fail to insert');
    console.error('  --quarantine             store quarantined rows in migration_quarantine');
    console.error('  --yes                    required confirmation for migrate');
    process.exit(command ? 1 : 0);
  }

  const sourceUrl = process.env.SQLSERVER_URL;
  const targetUrl = process.env.DATABASE_URL;
  if (!targetUrl) throw new Error('DATABASE_URL (PostgreSQL target) is required');

  validateCommand(command, args, sourceUrl);

  const targetSchema = args['target-schema'] || 'public';
  const targetClient = await connectPostgres(targetUrl);
  let sourcePool = null;

  try {
    const source = await loadSourceMetadata(args, sourceUrl ? (sourcePool = await connectSqlServer(sourceUrl)) : null);
    const target = await readTargetMetadata(targetClient, { schema: targetSchema, tables: listArg(args.tables) });
    const foreignKeys = await readTargetForeignKeys(targetClient, { schema: targetSchema });
    const plan = buildPlan({ source, target, foreignKeys });

    printPlan(plan);
    const reportFile = writeReport(command, { command, generatedAt: new Date().toISOString(), plan });

    if (command === 'plan') {
      console.log(`Report written to ${reportFile}`);
      return;
    }

    if (command === 'migrate') {
      const targetTables = plan.order;
      const existing = await readTargetExactRowCounts(targetClient, targetTables, { schema: targetSchema });
      const nonEmpty = Object.entries(existing).filter(([, count]) => count > 0);

      if (nonEmpty.length && !args.truncate) {
        throw new Error(
          `Target tables already contain rows: ${nonEmpty
            .map(([name, count]) => `${name}=${count}`)
            .join(', ')}. Re-run with --truncate to replace them.`
        );
      }

      if (args.truncate) {
        console.log(`Truncating ${targetTables.length} PostgreSQL tables...`);
        await truncateTables(targetClient, targetTables, { schema: targetSchema });
      }
      if (args.quarantine) await createQuarantineTable(targetClient, { schema: targetSchema });

      const primaryKeys = await readSourcePrimaryKeys(sourcePool, { schema: args.schema || 'dbo' });
      const stats = { startedAt: new Date().toISOString(), tables: [] };

      for (const name of plan.order) {
        const table = plan.tables.find((entry) => entry.name === name);
        if (!table || !table.columns.length) {
          console.log(`  ${name}: no copyable columns, skipped`);
          continue;
        }
        if (!(primaryKeys[name] || []).length) {
          console.log(`  ! ${name} has no primary key, falling back to slower offset paging`);
        }
        await copyTable({
          sourcePool,
          targetClient,
          table,
          planColumns: table.columns,
          primaryKeys: primaryKeys[name] || [],
          args,
          stats,
          schema: targetSchema,
        });
      }

      await analyzeTables(targetClient, plan.order, { schema: targetSchema });
      const total = stats.tables.reduce((sum, entry) => sum + entry.copied, 0);
      const quarantined = stats.tables.reduce((sum, entry) => sum + entry.quarantined, 0);
      console.log(`\nCopied ${total} rows across ${stats.tables.length} tables (${quarantined} quarantined).`);

      fs.writeFileSync(
        reportFile,
        JSON.stringify({ command, generatedAt: new Date().toISOString(), plan, stats }, null, 2)
      );
      return;
    }

    if (command === 'verify') {
      const tableNames = plan.order;
      const sourceCounts = await readSourceRowCounts(sourcePool, tableNames);
      const targetCounts = await readTargetExactRowCounts(targetClient, tableNames, { schema: targetSchema });

      const countMismatches = tableNames
        .map((name) => ({ table: name, source: sourceCounts[name] ?? 0, target: targetCounts[name] ?? 0 }))
        .filter((entry) => entry.source !== entry.target);

      console.log('\nRow counts');
      console.log('----------');
      for (const entry of countMismatches) {
        console.log(`  MISMATCH ${entry.table}: SQL Server ${entry.source}, PostgreSQL ${entry.target}`);
      }
      if (!countMismatches.length) {
        console.log(`  All ${tableNames.length} tables match.`);
      }

      const sourceSums = {};
      for (const check of deriveChecks(plan)) {
        const request = sourcePool.request();
        const result = await request.query(
          `SELECT CAST(SUM(CAST([${check.column}] AS DECIMAL(38,6))) AS VARCHAR(64)) AS total FROM [${check.table}]`
        );
        sourceSums[`${check.table}.${check.column}`] = { total: result.recordset[0].total || 0 };
      }

      const targetSums = await readNumericSums(targetClient, deriveChecks(plan), { schema: targetSchema });
      const sumMismatches = compareSums(sourceSums, targetSums);

      console.log('\nNumeric checks');
      console.log('--------------');
      for (const entry of sumMismatches) {
        console.log(`  MISMATCH ${entry.check}: SQL Server ${entry.source}, PostgreSQL ${entry.target}`);
      }
      if (!sumMismatches.length) {
        console.log(`  All ${Object.keys(targetSums).length} numeric checks match.`);
      }

      const orphans = await findOrphanRows(targetClient, foreignKeys, { schema: targetSchema });
      console.log('\nForeign keys');
      console.log('------------');
      if (orphans.length) {
        for (const orphan of orphans) console.log(`  ORPHANS ${orphan.table}: ${orphan.count} rows`);
      } else {
        console.log('  No orphaned rows.');
      }

      const failed = countMismatches.length + sumMismatches.length + orphans.length;
      fs.writeFileSync(
        reportFile,
        JSON.stringify(
          {
            command,
            generatedAt: new Date().toISOString(),
            countMismatches,
            sumMismatches,
            orphans,
            sourceCounts,
            targetCounts,
          },
          null,
          2
        )
      );

      console.log(failed ? `\nVerification FAILED with ${failed} issue(s).` : '\nVerification passed.');
      process.exitCode = failed ? 1 : 0;
    }
  } finally {
    if (sourcePool) await sourcePool.close().catch(() => {});
    await targetClient.end().catch(() => {});
  }
};

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main().catch((error) => {
    console.error(`\nERROR: ${error.message}`);
    process.exit(1);
  });
}
