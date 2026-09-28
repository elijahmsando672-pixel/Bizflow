# Auxiliary projects

This repository contains five projects beyond the running product
(`client/` + `server/` + `api/`). None of them are wired into the deployment,
and CI does not build or test any of them.

Read this before you assume something is broken, or before you invest in one of
them.

---

## `apps/api/` — NestJS rewrite (dormant)

A greenfield rewrite of the Express API in **NestJS 10** with **Prisma 5**,
`class-validator`, `@nestjs/swagger` and a Twilio WhatsApp bot.

### Status: not connected to anything

- No `node_modules`, no `dist` — **it has never been installed in this tree**
- Not in `docker-compose.yml`, `railway.json`, `render.yaml`, `vercel.json`, or
  CI
- No root `package.json` script references it
- The frontend does not call it
- It reuses **zero** code from `server/` — every one of its relative imports
  resolves within `apps/api/src`

Git history suggests development reverted to `server/` rather than continuing
this migration: the most recent `main` commit is a fix to the Express backend.

### What it contains

```
apps/api/src/
├── main.ts              bootstrap: prefix api/v1, :4000, ValidationPipe, Swagger at /docs
├── app.module.ts        ConfigModule, ThrottlerModule, 7 feature modules
├── auth/                register, login, profile + JwtAuthGuard + JwtStrategy
├── business/            business CRUD, members, invite
├── common/              PrismaService (@Global), @CurrentUser(), @RequireBusiness(), BusinessGuard
├── customers/           CRUD + transaction history
├── dashboard/           overview, chart, activity, stats
├── finance/             transactions, summary, categories, receipt
├── inventory/           products, low-stock, adjust-stock, categories
├── tasks/               CRUD, status, stats
└── whatsapp/            Twilio webhook + send
```

34 endpoints. Jest unit tests for auth, customers, finance and inventory;
`tasks` has none.

### What it gives up relative to `server/`

| Concern | `server/` (live) | `apps/api/` |
|---------|------------------|-------------|
| Auth | 15-min access + 7-day httpOnly refresh, rotation, CSRF | 7-day bearer token, **no refresh, no CSRF, no logout** |
| Hashing | Argon2id, bcrypt fallback | bcrypt cost 12 |
| Authorization | 15-resource permission matrix + role rank | role checked in exactly one branch |
| Rate limiting | 4 limiters, lockout, audit | `ThrottlerModule` registered, **guard never bound** |
| Data access | raw SQL, 67 tables | Prisma, **8 tables** |
| Background jobs | in-process queue + 3 intervals | none |
| Health check | `GET /api/health` | **none** — the Dockerfile probes a URL with no handler |

Its Prisma `Session` model is shaped for refresh tokens and is **never read or
written**.

### Known defects

- `business.service.ts` `inviteMember` re-parents an **existing** user to the
  current business and overwrites their role — a tenant-takeover and privilege
  escalation hazard
- The generated temp password for a new invite is never returned or emailed, so
  the invite is unusable
- `customers.service.ts` `getCustomerHistory` filters transactions on
  `customerId` without `businessId` — a cross-tenant read
- `finance.service.ts` decrements stock in a non-transactional loop, so a
  partial failure leaves inventory inconsistent
- `whatsapp.controller.ts` has **no guards at all** — `POST /whatsapp/send` is
  an unauthenticated send-as-anyone endpoint
- `dashboard.service.ts` imports `date-fns`, which is not in its `package.json`
  (it only resolves via hoisting from the root)
- `Dockerfile` assumes pnpm; the repo uses npm and has no `pnpm-workspace.yaml`
- `jest.config.js` maps `@bizflow/*` to `apps/*/src` instead of `packages/*/src`

### If you want to continue it

The port and prefix need reconciling first: it targets **4000** with
`/api/v1`, the live server is **5000** with `/api`. The client also depends on
endpoints the rewrite does not have — `/auth/refresh-token`, `/auth/csrf-token`,
`/auth/send-otp`, `/shops`, `/permissions/check`.

---

## `packages/` — shared libraries (unused)

Three private TypeScript libraries. Ten source files total. None is built, none
has a consumer.

### `@bizflow/database`

- `prisma/schema.prisma` — 8 models, 5 enums
- `prisma/seed.ts` — idempotent demo data
- `src/index.ts` — the standard Prisma dev-mode singleton plus
  `export * from '@prisma/client'`
- Scripts: `db:push`, `db:generate`, `db:migrate`, `db:seed`, `db:studio`,
  `db:reset`

Referenced by exactly one thing: `apps/api`'s `postinstall`, which runs
`prisma generate --schema=../../packages/database/prisma/schema.prisma`. The
`@bizflow/database` path alias in `apps/api/tsconfig.json` is declared and never
imported.

> This schema describes a **different, much smaller database** than the live
> one. See [Database](./database.md#the-prisma-schema-is-a-different-smaller-database).
> Never run `prisma db push` against the production Postgres.

### `@bizflow/ui`

Six lines: a `cn()` helper built on `clsx` + `tailwind-merge`. Despite the
name, it contains **no React components**. `client/` has its own `cn()` in
`lib/utils.ts` and does not use this.

### `@bizflow/utils`

Seven pure helpers: `formatCurrency`, `formatDate`, `formatRelativeTime`,
`generateSKU`, `slugify`, `parsePhoneNumber`, `truncate`. All `en-US` / `Intl`
based. `client/lib/format.ts` duplicates this role and does not import it.

### Monorepo plumbing that does not work

`turbo.json` and `turbo` as a root devDependency exist, but **no
`package.json` has a `workspaces` field** and there is no
`pnpm-workspace.yaml` or `pnpm-lock.yaml`. Turborepo is configured and driving
nothing. `.vercelignore` excludes `packages` from the Vercel upload entirely.

---

## `standalone/` — UI prototype

A React 18 + Vite 5 + react-router SPA on port 4000. ~25 page modules covering
POS, inventory, payments, logistics, shops, reports, customers and finance, with
a 1193-line `Dashboard.css` design system.

**It is a design mock, not an application.**

- **Zero network requests.** No `fetch`, no `axios`, no `VITE_` env var
  anywhere in `src/`. Every number is a hardcoded module-level array.
- **Auth is fake.** `Login.jsx` and `Register.jsx` mint a JWT in the browser
  with `btoa(...)` and sign it with the literal string `"secret"`. Any non-empty
  email and password logs in.
- `ProtectedRoute.jsx` decodes `localStorage.token` with `atob` and only checks
  that `payload.exp` is in the future.
- `AppLayout.jsx` renders a hardcoded user name, and `handleSearch` navigates
  to a fixed route regardless of the query.

Useful as a visual reference for a future admin UI. **Never treat it as an auth
surface or as evidence that an endpoint exists.**

React 18 and Vite 5, whereas `client/` is React 19 / Next 16 and
`bizflow-landing/` is React 19 / Vite 6 — three different stacks in one repo.

---

## `bizflow-landing/` — marketing site

React 19 + Vite 6 + Tailwind 3 + framer-motion. A single landing page composed of
nine sections: Navbar, Hero, Features, Stats, Testimonials, Pricing, FAQ, CTA,
Footer. Dark mode via a `ThemeProvider` toggling `.dark` on `<html>`, persisted
to `localStorage['bizflow-theme']` and defaulting to the OS preference.

Static — no backend, no API calls. It builds to a `dist/` and could be deployed
to any static host, but **no deployment config in this repo references it**; it
is not in `vercel.json`, `.vercelignore`, `docker-compose.yml`, `railway.*` or
`render.yaml`. It does have its own committed `package-lock.json`, so it has
been installed at some point.

Several declared dependencies are unused: `recharts`, `react-countup`,
`react-intersection-observer`. `react-router-dom` is mounted for a single
catch-all route.

---

## `migration/` — SQL Server importer (complete)

One-off CLI moving the original SQL Server database into the PostgreSQL schema.
Deliberately separate: `server/package.json` has `pg` and **no `mssql`**, so
production never touches the SQL Server driver.

```bash
npm --prefix migration run plan      # read-only mapping + copy order
npm --prefix migration run migrate   # requires --yes
npm --prefix migration run verify    # counts, money sums, FK orphans
```

`plan` works **offline** against a metadata fixture, so the mapping can be
reviewed before any database exists:

```bash
node migration/bin/migrate.js plan --source-metadata fixtures/legacy-source-metadata.json
```

**Safety design:** refuses to run without `--yes`; refuses a non-empty target
without `--truncate`; copies parents-first by topological sort of the
Postgres FK graph; each statement in its own transaction; `--skip-bad-rows`
requires `--quarantine` and rejected rows are stored in `migration_quarantine`,
never dropped.

This is the **only** project here with its own working test suite:

```bash
npm --prefix migration test
```

DB-backed tests skip unless `TEST_DATABASE_URL` is set.

Full detail, including the 30-entry type mapping and the six-step cutover
runbook, is in [`migration/README.md`](../migration/README.md). The last
recorded plan resolved 66 tables and 700 columns with zero warnings and zero
skipped columns.

---

## `scripts/` — ops and CI helpers

Excluded from the Vercel upload. Neither is part of a build pipeline.

### `validate-endpoints.js`

A cross-layer contract linter. It scans `client/src/**/*.ts{,x}` for
`fetchApi(...)` and `api.x.y(...)` calls, scrapes `router.get|post|...` from
`server/routes/*.js`, and reports both directions of mismatch — frontend calls
with no backend route, and backend routes with no frontend caller. It also
compares the root and `client` package versions.

```bash
npm run validate
```

**Two caveats:**

1. **It cannot currently fail.** Every finding goes through `logWarn`;
   `logError` is defined but never called, and it exits `1` only when
   `errors > 0`. A clean run proves nothing.
2. **It is half-stale.** It infers each router's mount point by scraping
   `app.use('/api/…')` from `server/index.js`, but the mounts moved to
   `server/app.js` (`mountRoutes`). The backend-route reconstruction is
   therefore wrong.

Useful as a review prompt. Do not gate on it, and re-point it at `app.js` before
relying on it.

### `keep-alive.sh`

Pings `https://bizflow-api-qo3d.onrender.com/api/auth/health` every 10 minutes
to keep Render's free tier awake. The crontab hint in the comment contains a
hardcoded home directory — edit it before use. It logs only; it takes no
corrective action.

---

## Summary

| Project | Kind | Framework | Installed | Deployed | In CI |
|---------|------|-----------|:---------:|:--------:|:-----:|
| `client/` | App | Next.js 16 | ✓ | ✓ | ✓ |
| `server/` | App | Express 4 | ✓ | ✓ | ✓ |
| `api/` | Deploy glue | Node ESM | ✓ | ✓ | — |
| `migration/` | CLI | `mssql` + `pg` | ✓ | one-off | tests only |
| `bizflow-landing/` | App | Vite 6 | lockfile only | — | — |
| `standalone/` | App | Vite 5 | — | — | — |
| `packages/*` | Libs | TypeScript | — | — | — |
| `apps/api/` | App | NestJS 10 | — | — | — |

**A change to `apps/api/`, `packages/`, `standalone/` or `bizflow-landing/`
cannot fail the build.** That is the practical consequence of the table above,
and the reason to know these projects exist before you go looking for a CI
failure that would have caught your mistake.
