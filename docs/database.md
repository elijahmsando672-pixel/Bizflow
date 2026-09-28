# Database reference

PostgreSQL 15+. **67 tables**, created by DDL in `server/config/db.js` (1194
lines) plus 61 index statements. There is no ORM and no migration runner in the
live application — raw SQL through `pg`.

## Connection

`server/config/db.js` exports the pool and the helpers:

```js
export const pool          // new Pool(buildPoolConfig())
export const query         // query(text, params) → pool.query
export const initDatabase  // runs all DDL, idempotent, with retries
export const shutdown      // ends the pool
export const buildPoolConfig
export const buildInitConfig
export const isServerless
export const isSupabase
export const isTransactionPooler
```

### Configuration sources

`DATABASE_URL` wins. Only if it is empty do the discrete `DB_HOST` / `DB_PORT` /
`DB_NAME` / `DB_USER` / `DB_PASSWORD` variables apply. Two Supabase shorthands
are also read in that fallback: `SUPABASE_DB_URL` and `SUPABASE_POOLER_URL`.

`DB_INIT_URL` overrides the connection used by `db:init` only, so schema
creation can use a direct or session-mode connection while the API uses the
transaction pooler.

### Environment helpers

| Helper | Detects |
|--------|---------|
| `isServerless` | `VERCEL`, `AWS_LAMBDA_FUNCTION_NAME`, `NETLIFY`, `FUNCTIONS_WORKER_RUNTIME` |
| `isSupabase` | host ends in `.supabase.co` or `.supabase.com` |
| `isTransactionPooler` | port `6543`, or `?pgbouncer=true` in the URL |

These drive three automatic behaviours:

- **Pool sizing.** Serverless instances default to **one** connection each,
  since instances are short-lived and numerous. Override with `DB_POOL_MAX`.
- **TLS.** Enabled automatically for Supabase hosts. Certificate *verification*
  defaults **off** for them, because Supabase's chain is not issued by a public
  root. Set `DB_SSL_REJECT_UNAUTHORIZED=true` to require it, or point
  `DB_SSL_CA` at a CA bundle.
- **Pooler detection.** `db:init` refuses to run through the transaction
  pooler, because advisory locks and DDL need a real session.

## Schema creation

Three ways to trigger it, in order of preference:

| Method | When |
|--------|------|
| `npm run db:init` | Deployment, CI, anywhere with DB access |
| Automatic on boot | Local dev, Docker — `DB_AUTO_INIT` unset or not `"false"` |
| Manual SQL | Applying `server/migrations/*.sql` by hand |

**Set `DB_AUTO_INIT=false` on serverless.** Platforms boot a fresh instance per
request, so DDL on boot is at best wasted work and at worst a lock storm.

`initDatabase` retries 10 times with exponential backoff. `server/index.js`
calls it *after* `app.listen` so health checks answer while the schema is still
being built, and leaves the server running even if all 10 attempts fail — it
logs `DB init failed after all retries` rather than exiting.

Every statement is `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`,
so running it against a populated database is safe.

## The tables

Grouped as `db.js` declares them.

### Core

| Table | Notes |
|-------|-------|
| `businesses` | The tenant root. Every other table hangs off it |
| `users` | `role` `VARCHAR(20)` default `'staff'`, `business_id` FK |
| `schema_migrations` | Applied-migration bookkeeping |

### Module 1 — Customers

`customers`, `customer_activities`

### Module 2 — Products and inventory

`products`, `categories`, `stock_movements`

### Module 3 — Sales and invoicing

`sales`, `sale_items`, `invoices`, `invoice_items`, `receipts`,
`invoice_templates`, `quotations`

### Module 4 — Expenses

`expenses`, `expense_categories`

### Module 5 — Creditors and suppliers

`creditors`, `creditor_purchases`, `creditor_payments`, `vendors`,
`purchase_orders`, `po_items`

### Module 6 — Cashflow and receivables

`cashflow_entries`, `debtors`, `debtor_invoices`, `debtor_payments`,
`payment_history`

### Module 7 — Notifications

`notifications`, `messages`, `push_subscriptions`

### Auth and security

`refresh_tokens`, `otp_codes`, `password_resets`, `verification_tokens`,
`totp_backup_codes`, `user_devices`, `ip_whitelist`, `login_attempts`,
`login_history`, `social_accounts`, `temp_tokens`, `api_keys`, `webhooks`

`refresh_tokens` stores a **SHA-256 hash**, not the token. Rotation is
delete-then-insert. `login_attempts` drives the 5-failures-in-15-minutes
lockout.

### HR

`employees`, `attendance`, `payroll`, `payroll_items`, `time_entries`

### CRM, pipeline, support

`leads`, `deals`, `deal_stages`, `deal_activities`, `support_tickets`,
`ticket_replies`, `sla_configs`

### Projects and procurement

`projects`, `project_tasks`

### Access control

`permissions` — one row per `(business_id, role_name, resource)` with
`can_create`, `can_read`, `can_update`, `can_delete`, `UNIQUE` on the triple and
an index on `(business_id, role_name)`. Seeded lazily on the first
`GET /api/permissions/permissions`.

`team_invitations` — pending invites, with token, role, inviter and expiry.

### Shops

`shops` — branches or outlets, for the multi-location switcher

### Payments

`mpesa_agents` — M-Pesa agent network with commission rates

### Reporting and AI

`report_schedules`, `ai_insights`

### Audit

`audit_logs`, `action_logs`

## Data conventions

- **Primary keys** are `UUID` with `gen_random_uuid()` defaults.
- **Money** is `NUMERIC(12,2)`, and `pg` returns it as a **string**. Parse before
  arithmetic — `parseFloat(row.total)` — or you get silent concatenation.
- **Timestamps** are `TIMESTAMP` (without time zone) defaulting to
  `CURRENT_TIMESTAMP`, stored as UTC by convention. The business timezone lives
  on `businesses.timezone`.
- **Tenancy** is `business_id UUID REFERENCES businesses(id)`, almost always
  `ON DELETE CASCADE`. Index it — every query filters on it.
- **Soft deletes** are `is_active BOOLEAN`, not `DELETE`. `DELETE /:id` on
  products, customers and shops usually flips the flag.

## Numbered migrations

`server/migrations/` holds six small SQL files. These are **not** run
automatically — `initDatabase` in `db.js` is the live mechanism, and the
numbered files are historical/one-off patches.

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Bootstrap |
| `002_unique_per_business.sql` | Composite uniqueness so two businesses can share a name |
| `003_add_missing_columns.sql` | Backfill |
| `004_new_tables.sql` | Later feature tables |
| `005_add_tax_amount_invoices.sql` | `tax_amount` on invoices |
| `006_widen_api_key_prefix.sql` | Widen `api_keys` key prefix |

> Because `db.js` owns the schema, **adding a column means editing `db.js`,
> not adding a `007_*.sql`.** A new numbered file alone will change nothing at
> runtime.

## Indexing

61 `CREATE INDEX IF NOT EXISTS` statements, mostly composite and usually
descending on the time axis:

```sql
CREATE INDEX ... ON transactions (business_id, created_at DESC);
CREATE INDEX ... ON customer_activities (business_id, created_at DESC);
```

`idx_permissions` covers `(business_id, role_name)` — the hot path for every
`requirePermission` check.

## Backups

```bash
npm run backup -- manual          # labels: manual | daily | weekly | monthly
```

Runs `server/scripts/backup.js`:

- shells out to **`pg_dump`**, which must be on `PATH`
- writes to `BACKUP_DIR` (default `server/backups`)
- rotates after each successful run
- aborts after `BACKUP_TIMEOUT_MS` (default `900000` = 15 min)
- honours `PGCONNECT_TIMEOUT` for the libpq connect phase
- **never puts credentials on the command line** — they go through the
  environment, so they do not appear in `ps` output

Under Docker the dump lands in the `backup_data` volume, mapped to
`/app/backups` (`docker-compose.yml:50-54`).

`server/tests/backup.test.js` covers argv construction, rotation and the
timeout without invoking `pg_dump`.

> Backups are **not scheduled** on Vercel. `npm run backup` needs a cron trigger
> or a long-running host. Supabase also offers managed backups and PITR, which
> is usually the better answer there.

## Legacy SQL Server migration

`migration/` is a one-off CLI that copies the original SQL Server database into
this schema. It is **not** used at runtime — `server/package.json` has no
`mssql` dependency. Full detail in
[`migration/README.md`](../migration/README.md); the short version:

```bash
npm --prefix migration run plan      # read-only: mapping, order, warnings
npm --prefix migration run migrate   # requires --yes, and --truncate if non-empty
npm --prefix migration run verify    # row counts, money sums, FK orphans
```

`plan` works offline against a metadata fixture, so the mapping can be reviewed
before any database exists:

```bash
node migration/bin/migrate.js plan --source-metadata fixtures/legacy-source-metadata.json
```

The last recorded plan (`migration/reports/`) resolved **66 tables and 700
columns** across 8 dependency waves, with zero unmatched tables and zero
skipped columns.

## The Prisma schema is a different, smaller database

`packages/database/prisma/schema.prisma` defines **8 models**, not 67. It is a
compact redesign for the dormant `apps/api` rewrite: it folds sales, invoices
and expenses into one `Transaction` row with a signed `type`, and drops CRM,
procurement, support, payroll and granular permissions entirely.

**It is not a description of the live database.** Do not use it to reason about
production data, and do not run `prisma db push` against the live Postgres — it
will not match, and it is destructive without a backup.

## Related

- [Backend](./backend.md) — the code that queries these tables
- [Deployment](./deployment.md) — pool sizing and Supabase specifics
- [Auxiliary projects](./auxiliary-projects.md) — the Prisma/`apps/api` story
