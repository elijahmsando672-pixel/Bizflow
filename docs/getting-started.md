# Getting started

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 22+ | `node -v` |
| npm | 11+ | `npm -v` |
| PostgreSQL | 15+ | `psql --version` |
| `pg_dump` | matching your PG | `pg_dump --version` â€” only for backups |

Optional: Docker (for `docker compose up`).

## Clone and install

```bash
git clone https://github.com/elijahmsando672-pixel/Bizflow.git
cd Bizflow
npm install
```

The root `postinstall` hook runs `npm --prefix client install && npm --prefix
server install`, so the single `npm install` covers all three trees. The repo is
**not** an npm-workspaces monorepo â€” each project installs independently.

> If you are only working on the frontend, `npm install && npm --prefix client
> install` is enough. Skip `server/` entirely if you are using mock data.

## Configure the environment

```bash
cp .env.example .env
```

Minimum viable `.env`:

```env
JWT_SECRET=<openssl rand -base64 64>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bizflow
DB_USER=postgres
DB_PASSWORD=postgres
```

See the full variable reference in
[Deployment](./deployment.md#environment-variables).

For the frontend:

```bash
cp client/.env.example client/.env.local   # if present, otherwise create it
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Create the database

The schema is created automatically on first boot, so you only need an empty
database:

```bash
createdb bizflow
```

`server/config/db.js` runs ~70 `CREATE TABLE IF NOT EXISTS` statements plus
indexes and default permission rows. It is idempotent, so booting twice is
safe.

To skip auto-init (recommended for serverless):

```env
DB_AUTO_INIT=false
```

â€¦and run it explicitly instead:

```bash
npm run db:init        # â†’ server/scripts/init-db.js
```

### Docker Postgres

```bash
docker compose up -d postgres
```

This publishes Postgres on **host port 5433** (`docker-compose.yml:13`), not
5432. Set `DB_PORT=5433`.

## Seed demo data

```bash
npm --prefix server run start     # boots and creates the schema
node server/seed.js               # or the helper
```

Or `npm --prefix server run seed:demo`.

The seed creates `elijah@bizflow.com` and prints a generated password once. Set
`SEED_DEMO_PASSWORD` to choose your own. It refuses to run when
`NODE_ENV=production` unless `SEED_DEMO_ALLOW_PRODUCTION=true` is set, so it
cannot plant a known login on a deployed database.

### Cleaning up a database seeded by an older version

Earlier versions of `seedDemo.js` wrote a fixed password that was published in the
repository's README. Any database seeded before that change still accepts it, and
nothing in the code can revoke a credential that already exists. On every
database that was ever seeded with that version, delete or disable the account
before going live:

```sql
-- Deactivate first so the row (and its FK children) survives for inspection.
UPDATE users SET is_active = false WHERE email = 'elijah@bizflow.com';

-- Then remove it and, if it was the only owner, the seeded business with it.
DELETE FROM users WHERE email = 'elijah@bizflow.com';
```

Check `login_attempts` and `audit_logs` for that account before deleting it, so
you can tell whether the credential was ever used. Rotating the password instead
of deleting leaves an unnecessary owner row behind, which is why deletion is the
better default here.

## Run

Two terminals:

```bash
# Terminal 1 â€” API on :5000
npm run server

# Terminal 2 â€” frontend on :3000
npm run dev
```

Or both at once:

```bash
npm run dev:all        # concurrently
```

Open <http://localhost:3000>.

Verify the API is healthy:

```bash
curl http://localhost:5000/api/health
# {"status":"ok","timestamp":"..."}
```

## All root scripts

Run from the repository root. Every one except `validate` and `backup` is a
thin proxy into `client/` or `server/`.

| Script | Command | What it does |
|--------|---------|--------------|
| `npm run dev` | `npm --prefix client run dev` | Next.js dev server on :3000 (Turbopack) |
| `npm run server` | `node server/index.js` | Express API on :5000 |
| `npm run dev:all` | `concurrently` | Both of the above |
| `npm run build` | `npm --prefix client run build` | Production frontend build |
| `npm start` | `npm --prefix client run start` | Serve the built frontend |
| `npm run lint` | `lint:client` + `lint:server` + `audit:tenancy` | Frontend ESLint, server ESLint, then the tenancy audit |
| `npm run lint:client` | `npm --prefix client run lint` | Frontend ESLint only |
| `npm run lint:server` | `eslint .` | Root ESLint flat config over `server/` and `scripts/` |
| `npm run audit:tenancy` | `node scripts/audit-tenancy.js` | Fails if any SQL touching a business-scoped table lacks a `business_id` predicate. `-- --explain` quotes the offending statement; `-- --json` is machine-readable |
| `npm run validate` | `node scripts/validate-endpoints.js` | Cross-layer API contract linter |
| `npm run db:init` | `server/scripts/init-db.js` | Create/upgrade the schema explicitly |
| `npm run backup` | `server/scripts/backup.js` | `pg_dump` with rotation. Label: `manual\|daily\|weekly\|monthly` |
| `npm run version:sync` | inline `node -e` | Copies the root version into `client/package.json` |
| `npm run validate` | — | See [below](#the-endpoint-contract-linter) |

> **`npm run audit:tenancy` is the one gate that can fail.** Unlike `validate` below,
> it exits non-zero on a violation and is wired into CI. It is a text-level check,
> so it cannot see a `business_id` predicate that is present but wrong, nor SQL in
> a file outside `server/{routes,controllers,services,middleware,utils}`.
>
> **`npm run validate` cannot currently fail.** The linter only calls
> `logWarn`, never `logError`, and exits `1` only when `errors > 0`. A clean run
> proves nothing. It is also half-stale: it scrapes route mount points from
> `server/index.js`, but the mounts moved to `server/app.js` (`mountRoutes`),
> so the backend-route reconstruction is wrong. Useful as a review aid, not as a
> gate.

## Server scripts

Run from `server/`, or via `npm --prefix server run <script>`.

| Script | Command |
|--------|---------|
| `start` | `node index.js` |
| `dev` | `node --watch index.js` |
| `test` | `vitest run` |
| `backup` | `node scripts/backup.js` |
| `db:init` | `node scripts/init-db.js` |

## Client scripts

Run from `client/`, or via `npm --prefix client run <script>`.

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |

## Testing

### Server â€” Vitest + supertest

```bash
npm --prefix server test
```

Four suites, all requiring a live PostgreSQL:

| File | Lines | Covers |
|------|-------|--------|
| `server/tests/api.test.js` | 414 | Auth, sales, products, customers, invoices, dashboard |
| `server/tests/runtime.test.js` | 223 | `isDirectRun`, `isServerless`, `configuration()`, CORS origin resolution |
| `server/tests/team-rbac.test.js` | 210 | Role escalation guards, `outranks`, last-owner protection |
| `server/tests/backup.test.js` | 112 | `pg_dump` argv construction, rotation, timeout |

`server/tests/test-server.js` boots the app once for the suite.

Environment the tests need:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bizflow_test
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=test-secret-key
NODE_ENV=test
```

CI does exactly this against a `postgres:16` service container
(`.github/workflows/ci.yml:22-51`).

```bash
createdb bizflow_test
DB_NAME=bizflow_test npm --prefix server test
```

### Frontend

**There are no frontend tests.** No test runner, no test files, no
`test` script in `client/package.json`. CI only lints and builds. Add coverage
by introducing a runner â€” Vitest + Testing Library is the natural fit given the
server already uses Vitest.

> `client/test-results/.last-run.json` exists, a leftover from a Playwright
> run. No Playwright config or specs are committed.

### Other suites

```bash
npm --prefix migration test        # Vitest; needs TEST_DATABASE_URL for DB tests
```

## Linting

```bash
npm run lint                        # frontend ESLint + server ESLint + tenancy audit
npm run lint:server                 # root eslint.config.js over server/ and scripts/
npm run audit:tenancy               # tenant-scoping check on every SQL statement
```

The server is linted by the **root** `eslint.config.js` — there is no separate
config in `server/` and no `lint` script in `server/package.json`, which is why
`lint:server` runs `eslint .` from the repository root. It reports warnings
predominantly from `no-console`, which the codebase uses deliberately for
startup and error logging; there are currently no errors.

`audit:tenancy` is the security-relevant one and the only root script that can fail
the build. It reads the business-scoped tables out of the schema and requires every
statement touching one to carry a `business_id` comparison. See
[tenant isolation](./tenant-isolation.md#the-check-that-keeps-this-true).

## Continuous integration

`.github/workflows/ci.yml` — triggers on push and PR to `main`.

| Job | Working directory | Does |
|-----|-------------------|------|
| `lint` | `client` | `npm ci` + `npm run lint` |
| `server-lint` | root | `npm ci` + `npm run lint:server` |
| `tenancy-audit` | root | `npm ci` + `npm run audit:tenancy`. No database needed — it reads the SQL as text |
| `server-test` | `server` | `npm ci` + `npx vitest run` against a `postgres:16` service |
| `build` | `client` | `npm ci` + `npm run build` |

Not covered by CI: `apps/api`, `packages/*`, `standalone/`, `bizflow-landing/`,
`migration/`, `api/`. A change to any of those cannot fail the build.

## Development conventions

### Adding a backend endpoint

1. Add the handler to the matching file in `server/routes/`, or create a new
   router module and mount it in `mountRoutes` (`server/app.js:204-252`).
2. Validate the body with a Joi schema in `server/utils/schemas.js`.
3. Filter every query by `req.business_id`. Never accept a tenant id from the
   client.
4. If the route base is not already in `resourceRouteMap`
   (`server/middleware/rbac.js:8-26`), add it â€” otherwise the new router is
   reachable by any authenticated member regardless of role.
5. Respond with `sendError(res, code, message)` on failure.

### Adding a frontend page

1. Create `client/src/app/<section>/page.tsx`.
2. Add the call to the `api` object in `client/src/lib/api.ts`. This is the
   only place `fetch` is called.
3. Add a sidebar entry to `NAVIGATION` in `client/src/lib/navigation.ts`.
4. Validate forms with Zod from `lib/validators.ts` plus `react-hook-form`.
5. Confirm the response shape â€” most endpoints return bare data, not an
   envelope. See [Architecture](./architecture.md#response-shapes-read-this-before-writing-a-client-call).

### Before you commit

```bash
npm run lint
npm --prefix server test
npm run build
```

## Troubleshooting

**`fetch failed` / `Unable to fetch` in the browser**
`NEXT_PUBLIC_API_URL` is unset or points somewhere unreachable, or CORS is
rejecting the origin. Check that the API is up (`curl localhost:5000/api/health`),
that `CORS_ORIGINS` includes the frontend origin *with scheme*, and that
`client/.env.local` is set â€” a `NEXT_PUBLIC_*` change needs a restart, not just
a reload.

**`FATAL ERROR: Missing required environment variables`**
`JWT_SECRET` is unset, or neither `DB_HOST` nor a `SUPABASE_*` URL is set and one
of `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` is missing. The check is
`server/app.js:61-78`.

**`ECONNREFUSED` on the database with Docker running**
Docker publishes Postgres on **5433**. Your `DB_PORT` says 5432.

**Tables missing after boot**
Set `DB_AUTO_INIT=false` at some point and it stayed set, or the init failed
after 10 retries. The server stays up either way and logs
`DB init failed after all retries`. Run `npm run db:init` manually.

**`JWT_SECRET is still the built-in default value`**
You are running the literal default
`bizflow-secret-key-change-in-production`. Generate a real one:
`openssl rand -base64 64`.

**`products.stock_qty` drifts from the sum of sales**
`INSERT` and `UPDATE` share a transaction, but a voided or deleted sale may not
restore stock. Check `stock_movements` and the audit log for the sale.

## Next

- [Architecture](./architecture.md) â€” how the pieces fit together
- [Backend](./backend.md) â€” every route, middleware and utility
- [Frontend](./frontend.md) â€” component and page conventions
