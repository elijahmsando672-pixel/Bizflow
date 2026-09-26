# SQL Server to PostgreSQL data migration

One-off tool that copies the legacy SQL Server database into the PostgreSQL schema
created by `server/config/db.js`. It is deliberately separate from the server: the
production Express app never depends on the SQL Server driver.

## Commands

All three commands read the source schema, read the PostgreSQL schema, and write a
report to `reports/`. Only `migrate` writes data.

```bash
npm run plan     # read-only: schema mapping, copy order, warnings
npm run migrate  # copies rows (requires --yes, and --truncate for a non-empty target)
npm run verify   # row counts, money sums, foreign key orphans
```

`plan` works without SQL Server access when a source metadata file is supplied, which
is how the plan was validated before a database was available:

```bash
node bin/migrate.js plan --source-metadata fixtures/legacy-source-metadata.json
```

`fixtures/legacy-source-metadata.json` is generated from `fixtures/legacy-schema.tsql.js`,
which is the schema DDL recovered from the last SQL Server revision of the server.
Regenerate it after editing the fixture with:

```bash
npm run fixture
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `SQLSERVER_URL` | Legacy source, e.g. `mssql://user:password@host:1433/database?encrypt=true` |
| `DATABASE_URL` | PostgreSQL target, e.g. `postgresql://user:password@host:5432/bizflow` |

Values are also read from `migration/.env`, then the repository `.env`, then
`server/.env` (existing process variables always win).

| Option | Default | Notes |
| --- | --- | --- |
| `--schema <name>` | `dbo` | SQL Server schema |
| `--target-schema <name>` | `public` | PostgreSQL schema |
| `--tables a,b` | all | Limit the copy to specific tables |
| `--source-metadata <file>` | – | Plan offline from a metadata JSON file |
| `--batch-size <n>` | `1000` | Rows per statement, capped by the 65535 parameter budget |
| `--truncate` | off | Required to copy into tables that already contain rows |
| `--skip-bad-rows` | off | Keep going when a row fails; requires `--quarantine` |
| `--quarantine` | off | Store rejected rows in `migration_quarantine` |
| `--yes` | – | Required confirmation for `migrate` |

## Safety behaviour

- `migrate` refuses to run without `--yes`.
- `migrate` refuses to copy into a target that already has rows unless `--truncate` is
  given, and `--truncate` only touches the tables in the plan.
- Tables are copied parents-first using the PostgreSQL foreign key graph, so the
  constraints stay satisfied during the copy. Each statement runs in its own
  transaction, so a failure never leaves a half-written statement behind.
- Rows are read with keyset pagination on the source primary key. A table without a
  primary key falls back to `OFFSET` paging, which is slower and is called out in the
  output.
- A rejected row rolls back its whole statement. Use `--skip-bad-rows` to keep going;
  it switches to one row per statement so good rows are not lost with a bad one.
- `--skip-bad-rows` cannot be used without `--quarantine`; rejected rows are stored in
  `migration_quarantine` with the original payload and the PostgreSQL error, never
  dropped.
- `verify` compares per-table row counts, sums of the money columns
  (`amount`, `total`, `subtotal`, `tax_amount`, `balance`, `amount_paid`, …) and counts
  orphaned foreign keys. It exits non-zero if anything differs.

## Type handling

| SQL Server | PostgreSQL | Notes |
| --- | --- | --- |
| `UNIQUEIDENTIFIER` | `uuid` | |
| `NVARCHAR`/`VARCHAR`/`NVARCHAR(MAX)` | `text`/`varchar` | Reports possible truncation when the target is narrower |
| `NVARCHAR(MAX)` holding JSON | `jsonb` | `api_keys.scopes`, `api_keys.permissions` and other JSON columns; empty string becomes `NULL` |
| `NVARCHAR(MAX)` holding an IP list | `inet[]` | `api_keys.ip_whitelist`; empty string becomes an empty array |
| `NVARCHAR(45)` | `inet` | `audit_logs.ip_address`, `login_attempts.ip_address` |
| `BIT` | `boolean` | |
| `DECIMAL`/`MONEY` | `numeric` | Read as text so no precision is lost |
| `DATETIME2`/`DATETIME` | `timestamp without time zone` | Formatted as naive local time, no timezone shift |
| `DATETIMEOFFSET` | `timestamp with time zone` | Converted to an absolute instant |
| `INT`/`BIGINT`/`SMALLINT`/`TINYINT` | `integer`/`bigint` | |
| `ROWVERSION`, `SQL_VARIANT`, computed columns | – | Skipped and listed in the plan report |

## Cutover runbook

1. `npm run plan` with `SQLSERVER_URL` set. Read the report: resolve every warning and
   every skipped column.
2. Take a `pg_dump` of the current PostgreSQL target and a full backup of SQL Server.
3. Restore a scratch PostgreSQL database, create the schema, and run
   `node bin/migrate.js migrate --yes --truncate` against it. Treat this run as the
   rehearsal.
4. `node bin/migrate.js verify` against the rehearsal database. It must report matching
   counts, matching sums and no orphans.
5. Repeat 3 and 4 against the real target, then repoint the app.
6. Keep SQL Server read-only until the business signs off.

## Tests

```bash
npm test
```

The suite covers T-SQL parsing, type mapping, planning, insert batching and foreign key
inspection. Tests that need a live database are skipped unless `TEST_DATABASE_URL` is
set, and they only create and drop temporary objects:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bizflow_test npm test
```
