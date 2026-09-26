# BizFlow — Business Management System

Modern business management dashboard built with Next.js (App Router), Express, and PostgreSQL.

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 15+
- npm

### 1. Clone & Install
```bash
git clone https://github.com/elijahmsando672-pixel/Bizflow.git
cd Bizflow
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your database and JWT settings
```

### 3. Database Setup
```bash
# The server auto-initializes the database schema on first run
npm run server
```

### 4. Run Development
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```
Visit http://localhost:3000

### Docker (alternative)
```bash
docker compose up --build
```

### Database Backups
```bash
# Requires the PostgreSQL client (pg_dump) on PATH
pg_dump --version
npm run backup -- manual   # labels: manual | daily | weekly | monthly
```
Dumps are written to `BACKUP_DIR` (default `server/backups`), rotated after each
successful run, and never include credentials on the command line.

### Legacy SQL Server Migration
One-off tooling for moving the original SQL Server database into PostgreSQL lives in
`migration/` and is not used at runtime. See [`migration/README.md`](migration/README.md)
for the plan/migrate/verify commands, type mapping, and the cutover runbook. The
application itself is PostgreSQL-only.

### Deploying to Vercel + Supabase
The frontend is a Next.js app and the API is an Express app deployed as a Vercel
function on the same origin, so `/api/*` never leaves the domain and cookie auth
needs no CORS.

`api/index.js` and `api/[...path].js` are the function entry points. They import
`server/app.js`, which builds the Express app without opening a port, running DDL,
or calling `process.exit()` — a serverless instance has to stay alive to answer the
request it was invoked for. `server/index.js` is only a bootstrap for long-running
hosts (Docker, Render, a VM) and does nothing when it is merely imported.

Supabase connection notes:
- Point `DATABASE_URL` at the **connection pooler**, not the direct connection.
  Vercel has no IPv6, so `db.<project>.supabase.co` is unreachable from a function.
  Use port `6543` (transaction mode) for the API and `5432` on the pooler host
  (session mode) wherever a real session is needed.
- TLS is enabled automatically for `*.supabase.co` and `*.supabase.com` hosts.
  Certificate verification defaults to off for them because Supabase's chain is not
  issued by a public root; set `DB_SSL_REJECT_UNAUTHORIZED=true` to require it.
- Serverless instances are short lived, so the pool defaults to one connection per
  instance, detected automatically from `VERCEL`. Override with `DB_POOL_MAX`.
- Schema creation is a deployment step, not a boot step. Set `DB_AUTO_INIT=false`
  and run it once from a machine that can reach the database directly:
  ```bash
  DB_INIT_URL=postgresql://postgres.<ref>:<password>@db.<ref>.supabase.co:5432/postgres npm run db:init
  ```
  `db:init` refuses to run through the transaction pooler, because advisory locks
  and DDL need a session.

Required Vercel environment variables:
```
DATABASE_URL          transaction pooler URL (port 6543)
DB_INIT_URL           direct or session connection, used by db:init only
DB_AUTO_INIT          false
JWT_SECRET            openssl rand -base64 64
APP_URL               https://your-app.vercel.app
NEXT_PUBLIC_API_URL   /api
CORS_ORIGINS          https://your-app.vercel.app
```

Serverless limitations worth knowing before going live:
- **Rate limits are per instance.** Counters live in memory, so the effective limit
  grows with the number of concurrent instances. Use a shared store (for example
  Upstash Redis) if the limits must be global.
- **Scheduled jobs do not self-trigger.** `addRepeatableJob` still works, but a
  frozen instance will not run it on time. Drive it from Vercel Cron or another
  scheduler.
- **Request bodies are capped at 4.5 MB** by the platform, below the 10 MB the
  import endpoint accepts. Oversized requests are rejected with `413` and a clear
  message.
- **Long-running work can exceed the function timeout** (`maxDuration` is 30s).
  Video processing and similar jobs should stay on a long-running host.
- **Argon2 needs a prebuilt binary.** If the runtime has no compatible native build,
  password hashing falls back to bcrypt automatically and logs a warning.
- **Backups are not scheduled on Vercel.** `npm run backup` needs a cron trigger or
  a long-running host; Supabase also offers its own managed backups and PITR.

## Login Credentials
Register a new account at `/signup`, or use the seed demo account:
- Email: `elijah@bizflow.com`
- Password: `Test@1234`

## Architecture

### Security
- **JWT access tokens** (15 min) + **httpOnly refresh tokens** (7 days, cookie-only, no XSS exposure)
- **CSRF protection** via double-submit cookie pattern
- **Rate limiting** — global (100/15 min), auth (5/15 min), refresh (20/15 min), password reset (3/hour)
- **Argon2id** password hashing with bcrypt fallback for legacy hashes
- **Helmet** security headers, HSTS in production, HTTPS redirect
- **Input sanitization** — strips null bytes and control characters
- **Account lockout** after 5 failed login attempts (15 min window)
- **Audit logging** for auth events

### OAuth (optional)
Google and Apple sign-in are supported but require credentials:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY=...
```
Strategies are only activated when the corresponding env vars are set.

### Error Handling
- Error boundaries (`error.tsx`, `global-error.tsx`) on frontend
- Structured server error responses with `console.error` logging
- 401 interceptor redirects to `/login` on refresh token failure

## Features
- **Dashboard** — Revenue, expenses, profit tracking, charts
- **Analytics** — Revenue trends, expense breakdown, top products (Recharts)
- **Sales & Invoicing** — Create sales, manage invoices, receipt generation
- **CRM** — Customer management, lead tracking, pipeline
- **Inventory** — Product management, stock tracking, low-stock alerts, restock budgeting
- **Projects** — Project management with tasks
- **Procurement** — Purchase orders, vendor management
- **Support** — Ticket management
- **Team** — Team members, roles, RBAC permissions
- **Time Tracking** — Track work hours
- **Expenses** — Expense categories, cashflow tracking
- **Reports** — Profit/loss, tax summaries
- **AI Insights** — Business predictions (requires Google AI API key)

## Tech Stack
- **Frontend**: Next.js 16.2.4 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Recharts
- **Backend**: Express 4, PostgreSQL, JWT + httpOnly refresh tokens, Argon2id, Passport.js (OAuth)
- **Validation**: Zod (frontend), Joi (backend)
- **Deployment**: Vercel (frontend), Docker / Railway (backend)

## Project Structure
```
Bizflow/
├── client/              # Next.js frontend (port 3000)
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # UI and layout components
│   │   └── lib/         # Auth context, API client, utils
│   └── public/          # Static assets
├── server/              # Express API (port 5000)
│   ├── config/          # DB, OAuth, email config
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, CSRF, RBAC, security
│   ├── routes/          # Express routers
│   └── utils/           # Password hashing, email, audit
├── scripts/             # CI/validation scripts
├── docker-compose.yml
└── .env.example
```

## Environment Variables

### Server (`server/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `SMTP_*` | Email configuration (welcome, password reset) |
| `GOOGLE_CLIENT_*` | Google OAuth credentials (optional) |
| `APPLE_*` | Apple Sign In credentials (optional) |
| `NEXT_PUBLIC_API_URL` | Backend URL for the frontend |
| `BACKUP_DIR` | Directory for `pg_dump` output (default `server/backups`) |
| `BACKUP_TIMEOUT_MS` | Maximum backup duration before it is aborted (default `900000`) |
| `PGCONNECT_TIMEOUT` | Seconds libpq waits for a database connection during backups |

### Client (`client/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:5000/api`) |
