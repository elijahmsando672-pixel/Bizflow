# BizFlow Documentation

BizFlow is a multi-tenant business management platform for small and mid-size
retail and service businesses. It covers point-of-sale, inventory, invoicing,
credit ledgers, CRM, support, procurement, payroll, reporting and AI insights.

This directory is the full technical reference. The root [`README.md`](../README.md)
is the short orientation document.

## Documentation index

| Document | Contents |
|----------|----------|
| [Getting started](./getting-started.md) | Prerequisites, local setup, every npm script, test suites |
| [Architecture](./architecture.md) | System topology, request lifecycle, auth flow, multi-tenancy |
| [Backend](./backend.md) | Express API: middleware chain, route inventory, auth, RBAC, jobs |
| [Frontend](./frontend.md) | Next.js App Router: layout, API client, page/component conventions |
| [Database](./database.md) | Schema, auto-migration, Prisma schema, legacy SQL Server migration |
| [Deployment](./deployment.md) | Docker Compose, Vercel, Railway, Render, Supabase, backups |
| [Auxiliary projects](./auxiliary-projects.md) | `apps/api`, `packages/*`, `standalone/`, `bizflow-landing/`, `scripts/` |

## The repository at a glance

BizFlow is **not** an npm-workspaces monorepo. It is a single repository
containing several independently versioned JavaScript projects, each with its own
`package.json` and its own `node_modules`. The root `package.json` is a thin
script proxy that shells into `client/` and `server/`.

```
Bizflow/
├── client/            # Next.js 16 App Router frontend        (port 3000)  ← LIVE
├── server/            # Express 4 + PostgreSQL API            (port 5000)  ← LIVE
├── api/               # Vercel serverless entry points         (deployed)
├── docker-compose.yml # postgres + backend + frontend
├── .github/workflows/ # CI: client lint, server tests, client build
│
├── apps/api/          # NestJS 10 + Prisma rewrite of the API  ← DORMANT
├── packages/          # Shared TS libs: database, ui, utils   ← UNUSED
├── standalone/        # React 18 + Vite UI mock, fake auth     ← PROTOTYPE
├── bizflow-landing/   # React 19 + Vite marketing site         ← UNDEPLOYED
├── migration/         # One-off SQL Server → PostgreSQL CLI    ← COMPLETE
└── scripts/           # Endpoint contract linter, keep-alive   ← OPS
```

### Which project is which

| Path | Kind | Stack | Status |
|------|------|-------|--------|
| `client/` | App | Next.js 16, React 19, TypeScript, Tailwind v4 | **Production frontend** |
| `server/` | App | Express 4, `pg`, Joi, Passport, Vitest | **Production backend** |
| `api/` | Deploy glue | Node ESM → Express | **Deployed to Vercel** |
| `apps/api/` | App | NestJS 10, Prisma 5, class-validator | Dormant rewrite; not wired anywhere |
| `packages/database/` | Library | Prisma 5 | Feeds `apps/api` only |
| `packages/ui/` | Library | `clsx` + `tailwind-merge` | No consumers |
| `packages/utils/` | Library | Pure TS helpers | No consumers |
| `standalone/` | App | React 18, Vite 5, react-router | Design prototype, mock data only |
| `bizflow-landing/` | App | React 19, Vite 6, Tailwind 3, framer-motion | Static marketing page |
| `migration/` | CLI | `mssql` + `pg` | One-off; has its own test suite |

> **If you are new to this repo, ignore `apps/api`, `packages/`, and
> `standalone/`.** They are exploratory work. The running product is
> `client/` + `server/` + `api/`. See
> [Auxiliary projects](./auxiliary-projects.md) for why.

## Feature surface

Every feature below is a real route group in `server/routes/` paired with a
page under `client/src/app/`.

| Area | Backend route | Frontend page |
|------|---------------|---------------|
| Point of sale / sales | `sales.js` | `/dashboard/sales`, `/dashboard/sales/new` |
| Invoices | `invoices.js` | `/dashboard/credit` |
| Receipts | `sales.js` | `/dashboard/sales` (receipt modal) |
| Products & stock | `products.js` | `/dashboard/products`, `/dashboard/inventory` |
| Categories | `products.js` | `/dashboard/categories` |
| Stock levels | `products.js` | `/dashboard/stocks`, `/dashboard/stocks/low` |
| Expenses | `expenses.js` | `/dashboard/expenses` |
| Expense categories | `expenses.js` | `/dashboard/expenses/categories` |
| Cashflow / revenue | `dashboard.js` | `/dashboard/revenue` |
| Budgets | `dashboard.js` | `/dashboard/budgets` |
| Customers | `customers.js` | `/dashboard/customers` |
| Credit (debtors) | `debtors.js` | `/dashboard/credit/transactions` |
| Creditors | `creditors.js` | `/creditors` |
| CRM leads | `crm.js` | `/crm` |
| Sales pipeline | `pipeline.js` | `/pipeline` |
| Support tickets | `support.js` | `/support` |
| Projects & tasks | `projects.js` | `/projects` |
| Procurement | `procurement.js` | `/procurement` |
| Suppliers | `procurement.js` | `/dashboard/suppliers` |
| Time tracking | `timetracking.js` | `/timetracking` |
| Employees & payroll | `employees.js` | `/employees` |
| M-Pesa payments | `payments.js` | `/dashboard/payments` |
| Reports & tax | `reports.js` | `/reports`, `/dashboard/reports` |
| AI insights | `ai.js` | `/ai` |
| Team & invites | `team.js` | `/team` |
| Users & roles | `users.js`, `permissions.js` | `/users`, `/permissions` |
| Shops / branches | `shops.js` | `/dashboard/shops` |
| Quotations | `quotations.js` | `/orders` |
| Reviews | `reviews.js` | `/reviews` |
| Messages | `messages.js` | `/messages` |
| Notifications | `notifications.js` | `/notifications` |
| Import / export | `importExport.js` | `/data-import` |
| Shops transfers | `shops.js` | `/dashboard/transfers` |
| Documents | — | `/documents` |
| Automation | — | `/dashboard/automation` |
| Marketing | — | `/dashboard/marketing` |
| Dispatch | — | `/dashboard/dispatch` |

## Tech stack

**Frontend** — Next.js 16.2 (App Router, Turbopack), React 19.2, TypeScript 5,
Tailwind CSS v4, Radix UI primitives, Recharts 3, react-hook-form + Zod 4,
Zustand, framer-motion, sonner, lucide-react, styled-components 6.

**Backend** — Node 22, Express 4.18, `pg` 8 (raw SQL, no ORM), Joi 17,
jsonwebtoken, Argon2id (bcrypt fallback), Passport (Google/Apple/Microsoft),
express-rate-limit, helmet, nodemailer, otplib (TOTP), swagger-jsdoc,
Vitest + supertest.

**Database** — PostgreSQL 15+ (16 in Docker), ~70 tables created by DDL in
`server/config/db.js`.

**Infrastructure** — Vercel (frontend + API as same-origin functions),
Supabase (managed Postgres), Docker Compose, Railway, Render.

## Local ports

| Service | Port | Notes |
|---------|------|-------|
| Next.js frontend | 3000 | `npm run dev` |
| Express API | 5000 | `npm run server` |
| PostgreSQL (Docker) | **5433** | Host-mapped from container 5432 |
| PostgreSQL (bare metal) | 5432 | What `.env.example` assumes |
| Vite (`standalone/`) | 4000 | Prototype only |
| NestJS (`apps/api`) | 4000 | Dormant; not installed |

> The Docker Postgres publishes **5433**, not 5432. If you run the stack with
> `docker compose up` and the API cannot reach the database, this port mismatch
> is the first thing to check.

## Demo credentials

Seed data is written by `server/seed.js` / `server/scripts/seedDemo.js`.

- Email: `elijah@bizflow.com`
- Password: `Test@1234`

The Prisma seed in `packages/database/prisma/seed.ts` uses a *different*
account (`demo@bizflow.com` / `demo1234`) that only exists in the `apps/api`
schema, not in the live database.
