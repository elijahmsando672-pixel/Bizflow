/**
 * Tenancy audit.
 *
 * Multi-tenancy in BizFlow is a `business_id` column enforced in application code.
 * Postgres does not enforce it: the foreign keys are plain single-column references,
 * so a query that forgets the tenant predicate returns another tenant's rows and
 * nothing raises. `server/routes/` has no data-access layer to inject that filter,
 * which means the convention lives in review and nowhere else.
 *
 * This makes it checkable. Every SQL statement that touches a business-scoped table
 * must either carry a `business_id` predicate or carry an inline
 * `/* tenant-exempt: <reason> *\/` marker explaining why it legitimately does not.
 *
 * Run with no arguments to report. Exits non-zero on any violation, so it can gate
 * a commit.
 *
 *   node scripts/audit-tenancy.js
 *   node scripts/audit-tenancy.js --json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = path.join(ROOT, 'server');

// Directories whose SQL is user-scoped rather than tenant-scoped, or is not a
// request path at all. Each is a deliberate carve-out, not a default.
const SCAN_DIRS = ['routes', 'controllers', 'services', 'middleware', 'utils'];

// `businesses` is the tenant itself, so filtering it by business_id is meaningless.
const TENANT_ROOT = 'businesses';

// Tables keyed by user rather than by tenant. They carry no business_id at all, so
// asking for one is the bug, not the omission. Derived from the schema, but pinned
// here as well so the list is reviewable in a diff.
const USER_SCOPED = new Set([
  'password_resets',
  'refresh_tokens',
  'otp_codes',
  'login_attempts',
  'verification_tokens',
  'totp_backup_codes',
  'user_devices',
  'temp_tokens',
  'social_accounts',
  'schema_migrations',
]);

// Requiring a full statement shape keeps prose out. Without this, the log message
// 'Bulk update permissions error:' parses as an `UPDATE permissions` statement,
// because the words after the verb happen to name a real table.
const LOOKS_LIKE_SQL = [
  /\bSELECT\b[\s\S]*?\bFROM\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+[a-z_][a-z0-9_.]*\s+SET\b/i,
];
const TABLE_REF =
  /\b(?:FROM|JOIN|INTO|UPDATE)\s+(?:ONLY\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi;
const TENANT_PREDICATE = /\bbusiness_id\s*(?:=|!=|<>|IN\b|ANY\b)/i;
const MENTIONS_TENANT_COLUMN = /\bbusiness_id\b/i;
// A WHERE clause assembled in JS — `WHERE ${conditions.join(' AND ')}` — cannot be
// judged from the literal alone, so these are reported separately for a human.
const DYNAMIC_WHERE = /\$\{[^}]*\b(where|conditions|filter|clause|predicates|parts)\b[^}]*\}/i;

const looksLikeSql = (text) => LOOKS_LIKE_SQL.some((shape) => shape.test(text));

const SKIP_FILES = new Set(['config/db.js']);

const toRel = (full) => path.relative(ROOT, full).split(path.sep).join('/');

/**
 * Business-scoped tables, read out of the schema rather than hardcoded, so a table
 * added without a `business_id` column cannot silently drop out of the audit.
 */
function loadTenantTables() {
  const schema = fs.readFileSync(path.join(SERVER, 'config', 'db.js'), 'utf8');
  const create = /CREATE TABLE(?: IF NOT EXISTS)?\s+([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\n\s*\);/g;
  const tables = new Set();
  let match;
  while ((match = create.exec(schema)) !== null) {
    if (/business_id/i.test(match[2])) tables.add(match[1]);
  }
  if (tables.size === 0) {
    throw new Error('No business-scoped tables found in server/config/db.js');
  }
  return tables;
}

/** Every .js file under one of the scanned directories. */
function listSources() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const abs = path.join(SERVER, dir);
    if (!fs.existsSync(abs)) continue;
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.js') && !SKIP_FILES.has(toRel(full))) files.push(full);
      }
    };
    walk(abs);
  }
  return files;
}

/**
 * Pulls SQL out of a source file by anchoring on the call sites.
 *
 * Earlier this scanned every string and template literal, which let prose through:
 * an apostrophe inside a comment pairs with the next apostrophe in the file and
 * swallows the query sitting between them. Matching `query(  <literal>` instead
 * means only something actually handed to the driver is ever considered.
 */
function extractStatements(src) {
  const statements = [];
  const push = (text, index) => {
    if (!looksLikeSql(text)) return;
    statements.push({ text, index, kind: 'literal' });
  };

  // query(`...`) / client.query(`...`) / pool.query('...')
  const templates = /query\(\s*(`(?:\\[\s\S]|[^`\\])*`)/g;
  let match;
  while ((match = templates.exec(src)) !== null) {
    const literal = match[1];
    push(literal.slice(1, -1), match.index + match[0].length - literal.length);
  }

  const quoted = /query\(\s*('(?:\\.|[^'\\])*')/g;
  while ((match = quoted.exec(src)) !== null) {
    const literal = match[1];
    push(literal.slice(1, -1), match.index + match[0].length - literal.length);
  }

  // A statement held in a variable before being run, which is how the tenant guard
  // and the permission checks are written. Parameterised SQL this specific is not
  // something prose produces by accident.
  const held = /=\s*(`(?:\\[\s\S]|[^`\\])*`)/g;
  while ((match = held.exec(src)) !== null) {
    const literal = match[1];
    const text = literal.slice(1, -1);
    if (!text.includes('$1')) continue;
    push(text, match.index + match[0].length - literal.length);
  }

  return statements;
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length;

/** Tables a statement reads from, joins to, inserts into or updates. */
function referencedTables(text) {
  const tables = new Set();
  let match;
  TABLE_REF.lastIndex = 0;
  while ((match = TABLE_REF.exec(text)) !== null) {
    tables.add(match[1].toLowerCase());
  }
  return tables;
}

/**
 * Classifies one statement against the tenant rule.
 *
 * Three shapes are satisfied by construction and must not be reported:
 *
 * - an INSERT that names `business_id` in its column list — the row is *placed* in a
 *   tenant rather than selected from one, and supplying the column is what makes it
 *   safe, so requiring a comparison would be wrong;
 * - a statement whose WHERE is interpolated from a JS array;
 * - an UPDATE that sets `business_id`, which is a tenant move rather than a
 *   tenant-blind write.
 *
 * Everything else must show a comparison, because that is the only form that can
 * exclude another tenant's row.
 */
function classify(text) {
  if (/^\s*INSERT\b/i.test(text)) {
    return MENTIONS_TENANT_COLUMN.test(text) ? 'ok' : 'insert-without-tenant';
  }
  if (DYNAMIC_WHERE.test(text)) return 'dynamic';
  if (TENANT_PREDICATE.test(text)) return 'ok';
  // An UPDATE may carry the predicate in its SET list rather than its WHERE.
  if (/^\s*UPDATE\b/i.test(text) && /\bSET\b[\s\S]*\bbusiness_id\b/i.test(text)) return 'ok';
  return MENTIONS_TENANT_COLUMN.test(text) ? 'tenant-column-elsewhere' : 'unscoped';
}

/**
 * The `/* tenant-exempt: reason *\/` marker immediately above a statement.
 *
 * The marker speaks for the statement it sits on and nothing else, so it is
 * invalidated if another SQL keyword appears between the marker and the statement
 * — otherwise a single marker would silently exempt every statement after it.
 */
const FILE_EXEMPT =
  /\/\*\s*tenant-exempt-file:\s*([a-z_,\s]+?)\s+[—-]+\s+([^*]+?)\s*\*\//i;

function exemptionFor(src, index) {
  const before = src.slice(Math.max(0, index - 600), index);
  const last = before.lastIndexOf('tenant-exempt:');
  if (last === -1) return null;

  const between = before.slice(last);
  if (/\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i.test(between)) return null;

  const reason = between.match(/tenant-exempt:\s*([^\n*]+)/);
  return reason ? reason[1].trim() : null;
}

/**
 * A file-level declaration, naming the tables it covers.
 *
 *   /* tenant-exempt-file: users — pre-authentication, identity is the scope *\/
 *
 * Naming the tables rather than the whole file keeps the door shut on the rest:
 * a new `customers` query in a file that legitimately works on `users` still has
 * to carry its own tenant predicate. Used by the pre-authentication controller,
 * where every statement is keyed on the caller's identity or a single-use emailed
 * token and there is no session whose `business_id` could scope it.
 */
function fileExemptionFor(src) {
  const head = src.slice(0, 2000);
  const match = head.match(FILE_EXEMPT);
  if (!match) return null;
  const tables = new Set(
    match[1].split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  );
  return { tables, reason: match[2].trim() };
}

function audit({ json = false } = {}) {
  const tenantTables = loadTenantTables();
  const files = listSources();
  const findings = [];
  let statementsChecked = 0;

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const fileExempt = fileExemptionFor(src);
    for (const statement of extractStatements(src)) {
      const tables = referencedTables(statement.text);
      const touched = [...tables].filter(
        (t) => tenantTables.has(t) && t !== TENANT_ROOT && !USER_SCOPED.has(t)
      );
      if (touched.length === 0) continue;

      statementsChecked++;
      const line = lineOf(src, statement.index);
      const exempt = exemptionFor(src, statement.index);
      if (exempt) {
        findings.push({ file: toRel(file), line, tables: touched, severity: 'exempt', reason: exempt });
        continue;
      }
      const severity = classify(statement.text);
      if (severity === 'ok' || severity === 'dynamic') continue;
      if (fileExempt && touched.every((t) => fileExempt.tables.has(t))) {
        findings.push({
          file: toRel(file),
          line,
          tables: touched,
          severity: 'exempt',
          reason: fileExempt.reason,
        });
        continue;
      }
      findings.push({
        file: toRel(file),
        line,
        tables: touched,
        severity,
        text: statement.text.replace(/\s+/g, ' ').trim(),
      });
    }
  }

  const violations = findings.filter((f) => f.severity !== 'exempt');
  const exempted = findings.filter((f) => f.severity === 'exempt');

  if (json) {
    console.log(JSON.stringify({ statementsChecked, violations, exempted }, null, 2));
  } else {
    console.log('\n🔒 Tenancy audit\n');
    console.log(`   ${tenantTables.size} business-scoped tables`);
    console.log(`   ${statementsChecked} statements touching them across ${files.length} files\n`);

    const groups = new Map();
    for (const finding of violations) {
      if (!groups.has(finding.file)) groups.set(finding.file, []);
      groups.get(finding.file).push(finding);
    }

    for (const [file, list] of [...groups.entries()].sort()) {
      console.log(`   ${file}`);
      for (const finding of list) {
        const detail = {
          unscoped: 'no business_id predicate at all',
          'tenant-column-elsewhere': 'business_id is referenced but never compared',
          'insert-without-tenant': 'INSERT does not supply business_id',
        }[finding.severity];
        console.log(`     ${String(finding.line).padStart(5)}  ${finding.tables.join(', ')}  — ${detail}`);
        if (process.argv.includes('--explain')) {
          console.log(`           ${finding.text.replace(/\s+/g, ' ').trim().slice(0, 300)}`);
        }
      }
      console.log('');
    }

    console.log(
      `   ${violations.length} violation(s), ${exempted.length} marked exempt\n`
    );
  }

  return violations.length;
}

process.exit(audit({ json: process.argv.includes('--json') }) > 0 ? 1 : 0);