# Deployment

Three supported targets. The choice is essentially "where does the API run",
because the frontend is always the same Next.js build.

| Target | Frontend | API | Database |
|--------|----------|-----|----------|
| Docker Compose | `client/Dockerfile` → :3000 | `server/Dockerfile` → :5000 | `postgres:16-alpine` → **:5433** |
| Vercel + Supabase | Next.js on Vercel | `api/*.js` as a function, same origin | Supabase pooler :6543 |
| Vercel + any Postgres host | Next.js on Vercel | Express on a long-running host, cross-origin | Managed Postgres |

## Docker Compose

```bash
docker compose up --build
```

### Services

**`postgres`** — `postgres:16-alpine`, database `bizflow`, user `postgres`,
password from `DB_PASSWORD` (default `postgres`). Published on **host port
5433**, volume `postgres_data`, healthcheck `pg_isready -U postgres` every 10 s.

> **The 5433 mapping is the single most common local-setup mistake.** The
> container is on 5432, but your client connects from the host, so it gets 5433.
> `.env.example` assumes 5432 (bare-metal Postgres), so you must reconcile the
> two.

**`backend`** — built from `server/Dockerfile`, exposed on :5000. Waits for
`postgres` to be healthy. Healthcheck curls `http://localhost:5000/api/health`
every 30 s, 40 s start period. Backups go to the `backup_data` volume mounted
at `/app/backups`.

**`frontend`** — built from `client/Dockerfile`, exposed on :3000. Waits for
`backend` to be healthy, so the stack comes up in dependency order. Build args
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` (used by `robots.ts` /
`sitemap.ts`) and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

> The Cloudflare Turnstile key defaults to empty, which leaves Cloudflare's
> always-pass test key in place and makes the sign-in CAPTCHA a no-op. Set a
> real site key for a public deployment.

### Frontend Docker details

`client/next.config.ts` sets `output: 'standalone'` off Vercel, so the image
runs `node server.js` against a self-contained `.next/standalone` bundle. Two
config guards make that work and are worth not removing:

- `outputFileTracingRoot: __dirname` — without it, a stray lockfile in a parent
  directory makes Next infer a higher workspace root, which nests the output
  under a prefixed path and breaks the entrypoint.
- `turbopack.root: __dirname` — same reason.

### Helper scripts

`deploy.sh` and `stop.sh` at the repo root wrap the Compose lifecycle.

## Vercel + Supabase (the intended production shape)

```
client/.next  ─────────────────►  React pages
api/index.js, api/[...path].js ─►  server/app.js  ─►  Supabase :6543
```

Both live on **one Vercel origin**, so `/api/*` never leaves the domain and
cookie auth needs no CORS.

### How the function entry points work

`api/index.js` and `api/[...path].js` are byte-identical 12-line files:

```js
import handler from '../server/vercel-handler.js';
import { configuration } from '../server/app.js';

const { missing, warnings } = configuration();
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (missing.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
}

export const config = { maxDuration: 30 };

export default handler;
```

Importing `app.js` builds the whole Express app. It binds no port and runs no
DDL, which is what makes it importable from a function. Note the
configuration failure is **reported, not fatal** — a serverless function that
calls `process.exit()` is killed mid-request. A misconfigured deployment still
boots and surfaces the problem through logs and a `503` from `/api/health`.

Two files because Vercel maps by filename: `index.js` serves `/api`,
`[...path].js` serves the `/api/*` catch-all. The catch-all handles the nested
paths, so they do not conflict.

`vercel.json` forwards the OAuth callbacks, which live outside `/api`:

```json
"rewrites": [{ "source": "/auth/:path*", "destination": "/api/_auth/:path*" }]
```

`vercel-handler.js` maps `/api/_auth/*` back to `/auth/*` before Express sees
it, so the router in `app.js:259-261` matches.

### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm --prefix client run build",
  "installCommand": "npm install",
  "outputDirectory": "client/.next",
  "functions": { "api/*.js": { "maxDuration": 30 } },
  "rewrites": [{ "source": "/auth/:path*", "destination": "/api/_auth/:path*" }]
}
```

### `.vercelignore`

Excludes what the function does not need: `node_modules`, `standalone`,
`packages`, `scripts`, `*.md`, `*.png`, `*.log`, `.env*`, `.next`,
`Dockerfile`, `docker-compose.yml`, `deploy.sh`, `stop.sh`.

`api/` and `server/` are **not** ignored — they are the function. `migration/`
is also uploaded; it is small and inert, but it is dead weight in the bundle.

### Required Vercel environment variables

```env
SUPABASE_POOLER_URL  transaction pooler URL, port 6543
DB_INIT_URL          direct or session connection — db:init only
DB_AUTO_INIT         false
JWT_SECRET           openssl rand -base64 64
APP_URL              https://your-app.vercel.app
NEXT_PUBLIC_API_URL  /api
CORS_ORIGINS         https://your-app.vercel.app
```

### Supabase connection notes

- Point `SUPABASE_POOLER_URL` at the **connection pooler**, not the direct connection.
  Vercel has no IPv6, so `db.<project>.supabase.co` is unreachable from a
  function. Use port **6543** (transaction mode) for the API and **5432** on the
  pooler host (session mode) wherever a real session is needed.
- TLS is enabled automatically for `*.supabase.co` / `*.supabase.com`.
- **Certificate verification is on by default.** Supabase's certificate is issued by
  Supabase's own CA rather than a public root, so verifying it requires pinning that CA:
  download `prod-ca-2021.crt` from Dashboard → Database → SSL Configuration and set
  `DB_SSL_CA_PEM` to its contents (or `DB_SSL_CA` to a path if the runtime has a
  filesystem). With `NODE_ENV=production` and no CA the API **refuses to start** rather
  than quietly falling back to unverified TLS. Outside production it warns once and
  continues unverified. `DB_SSL_REJECT_UNAUTHORIZED=false` is an explicit escape hatch.
- The pool defaults to **one connection per instance**, detected from `VERCEL`.
  Override with `DB_POOL_MAX`.

### Create the schema once

Schema creation is a deployment step, not a boot step. Run it from a machine
that can reach the database directly:

```bash
DB_INIT_URL=postgresql://postgres.<ref>:<password>@db.<ref>.supabase.co:5432/postgres npm run db:init
```

`db:init` refuses to run through the transaction pooler — advisory locks and
DDL need a session.

### Serverless limitations

Know these before going live.

| Limitation | Detail |
|-----------|--------|
| **Rate limits are per instance unless Upstash is configured** | See [Shared rate limits](#shared-rate-limits). The API logs a warning at boot when it detects a production serverless host with no shared store |
| **Scheduled jobs do not self-trigger** | `addRepeatableJob` uses `setInterval`; a frozen instance will not run it on time. Drive from Vercel Cron |
| **Request bodies capped at 4.5 MB** | Below the 10 MB the import endpoint accepts. `vercel-handler.js` rejects oversized requests with `413` and a clear message |
| **30 s function timeout** | `maxDuration: 30`. Video processing and similar long jobs belong on a long-running host |
| **Argon2 needs a prebuilt binary** | If the runtime has no compatible native build, hashing falls back to bcrypt automatically and logs a warning |
| **No application-level backups** | `npm run backup` needs a cron trigger or a long-running host. Rely on Supabase PITR instead — see [Backups and cron](#backups-and-cron) |

## Shared rate limits

`express-rate-limit` keeps counters in memory by default. On Vercel each warm
instance has its own counters, so "5 login attempts per 15 minutes" really means
5 per instance, and an attacker only has to spread requests across instances to
multiply the budget.

Login, refresh-token and password-reset limits use a shared store when Upstash is
configured. Set both values in Vercel (Database → Redis at
[console.upstash.com](https://console.upstash.com) gives you a REST endpoint and
token, and the free tier is enough):

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

With both set, the counters are shared across every instance via Redis. Without
them the limiters fall back to memory, which is still fine on a single long-lived
host but is not a real control on serverless — the API logs a warning at boot when
it detects `NODE_ENV=production` on a serverless host with no store configured, so
this is not a silent downgrade.

The general API limiter (`100 / 15 min`) stays in memory on purpose: it is a
guard against runaway clients, not an authentication control.

## Backups and cron

Vercel functions are ephemeral and short-lived, so neither `npm run backup` nor
the in-process `setInterval` scheduler survives reliably. Do not depend on them
for data protection.

**Backups.** Use Supabase's own mechanisms, which run independently of this app:

- **Point-in-time recovery (PITR)** on the production database. Restore to any
  moment in the retention window. This is the primary safety net.
- **Daily logical backups** are included on paid plans; confirm which retention
  your plan gives you and that the earliest restorable point is inside it.
- Test a restore. A backup that has never been restored is a hypothesis.

**Scheduled jobs.** There is currently **no cron-triggerable job endpoint** in this
codebase — `addRepeatableJob` in `server/utils/jobQueue.js` is not wired to any route,
so nothing is scheduled on any host. If you add one, drive it from Vercel Cron, which
makes an HTTP request on a schedule rather than relying on a warm instance:

```jsonc
// vercel.json
{
  "crons": [
    { "path": "/api/jobs/daily", "schedule": "0 3 * * *" }
  ]
}
```

Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set. The
route **must** compare that header and return `401` otherwise, or anyone who guesses
the URL can trigger your jobs:

```js
import crypto from 'crypto';

const safeEqual = (a, b) =>
  a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const requireCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  const header = req.get('Authorization') || '';

  // Refusing to run the handler at all when CRON_SECRET is unset is deliberate:
  // an unauthenticated job endpoint is worse than no job endpoint.
  if (!secret || !header.startsWith('Bearer ') || !safeEqual(header.slice(7), secret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

Without `CRON_SECRET` this rejects everything rather than defaulting to open. Note that
Hobby plans are limited to daily crons, so a weekly schedule needs a paid plan.

Until such a route exists, run recurring work from the long-running Docker/VM
deployment, where `setInterval` is actually reliable.

## Long-running host (Docker, VM)

Any host that keeps a Node process alive can run the API directly:

```bash
cd server && npm install && NODE_ENV=production node index.js
```

Environment:

```env
DB_HOST         postgres host
DB_PORT         5432
DB_NAME         bizflow
DB_USER         bizflow
DB_PASSWORD     secret
JWT_SECRET      openssl rand -base64 64
NODE_ENV        production
CORS_ORIGINS    https://your-app.vercel.app
APP_URL         https://your-app.vercel.app
```

Then on Vercel set `NEXT_PUBLIC_API_URL` to the API base URL (including the
`/api` prefix) and redeploy.

This layout is **cross-origin** — the API is on a different domain, so
`CORS_ORIGINS` must list the frontend origin *with its scheme*, and cookies are
subject to `SameSite` rules. Expect to fight CORS here; the single-origin Vercel
layout avoids it entirely.

`server/index.js:35-44` binds the port before DDL and sets
`timeout` 30 s / `keepAliveTimeout` 65 s / `headersTimeout` 35 s, so a container
or host health probe is not killed mid-boot.

## Environment variables

### Server

| Variable | Required | Purpose |
|----------|:--------:|---------|
| `JWT_SECRET` | yes | Signs access tokens. ≥32 chars. `openssl rand -base64 64` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | yes | PostgreSQL target. Either all five, or `SUPABASE_*` |
| `DB_SSL` | no | Force TLS on or off. TLS is always on for Supabase hosts |
| `DB_SSL_CA_PEM` | **yes for Supabase in production** | Supabase's CA certificate as PEM text |
| `DB_SSL_CA` | no | Path to a CA bundle, as an alternative to `DB_SSL_CA_PEM` |
| `DB_SSL_REJECT_UNAUTHORIZED` | no | Defaults to on. Set `false` to encrypt without verifying |
| `DB_INIT_URL` | no | Connection for `db:init` only |
| `DB_AUTO_INIT` | no | `false` skips DDL on boot. **Set this on serverless** |
| `DB_POOL_MAX` | no | Pool size. Defaults to 1 when `VERCEL` is set |
| `DB_POOL_IDLE_TIMEOUT_MS` / `DB_CONNECT_TIMEOUT_MS` / `DB_APPLICATION_NAME` | no | Pool tuning |
| `SUPABASE_DB_URL` / `SUPABASE_POOLER_URL` | no | Supabase shorthands, used when the discrete `DB_*` vars are absent |
| `CORS_ORIGINS` | prod | Comma-separated allowed origins, **with scheme** |
| `APP_URL` | prod | The public frontend URL. Also added to the CORS allowlist |
| `NEXT_PUBLIC_API_URL` | no | Its *origin* is added to the CORS allowlist |
| `CORS_ALLOW_ALL` | no | `true` disables the production origin check |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | **prod, serverless** | Shared Redis for auth rate limits. See [Shared rate limits](#shared-rate-limits) |
| `CRON_SECRET` | no | Bearer token Vercel Cron sends. Job routes must verify it |
| `SEED_DEMO_PASSWORD` / `SEED_DEMO_ALLOW_PRODUCTION` | no | Demo seed controls. The seed refuses to run when `NODE_ENV=production` |
| `PORT` | no | Defaults to 5000 |
| `NODE_ENV` | no | `production` enables HTTPS redirect, HSTS, secure cookies |
| `BUSINESS_NAME` | no | Used in receipts and emails |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | no | Email delivery |
| `GEMINI_API_KEY` | no | Server-side AI insights |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Google OAuth |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | no | Apple Sign In |
| `MPESA_SHORTCODE` / `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | no | M-Pesa STK |
| `BACKUP_DIR` | no | `pg_dump` output directory. Default `server/backups` |
| `BACKUP_TIMEOUT_MS` | no | Backup abort threshold. Default `900000` |
| `PGCONNECT_TIMEOUT` | no | libpq connect timeout during backups |
| `PLATFORM_BODY_LIMIT_BYTES` | no | Serverless body cap. Default `4608000` (4.5 MB) |
| `SECURITY_PGP_KEY` | no | URL in `/.well-known/security.txt` |

### Client

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL. Default `/api` (correct on Vercel); `http://localhost:5000/api` in dev |
| `NEXT_PUBLIC_SITE_URL` | Consumed by `robots.ts` and `sitemap.ts`. Without it they fall back to the API URL and advertise the backend as the site root |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile. Empty leaves the always-pass test key in place |

A `NEXT_PUBLIC_*` change requires a **restart**, not a reload.

## Pre-deploy checklist

```bash
npm run lint
npm --prefix server test
npm run build
```

Then:

- [ ] `JWT_SECRET` set to a real value, not the built-in default
- [ ] `CORS_ORIGINS` includes the frontend origin **with scheme**
- [ ] `APP_URL` set (production warns without it)
- [ ] `DB_AUTO_INIT=false` and `db:init` already run once
- [ ] `SUPABASE_POOLER_URL` points at the pooler if the host is serverless
- [ ] `DB_SSL_CA_PEM` set to Supabase's CA — the API refuses to boot without it
- [ ] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` set if serverless, so auth rate limits are shared
- [ ] Supabase **PITR enabled** and a restore tested
- [ ] `CRON_SECRET` set **if** a cron job route has been added
- [ ] Health endpoint returns `{"status":"ok"}` — not `503`
- [ ] Root and `client/package.json` versions match — `npm run version:sync`

## Related

- [Architecture](./architecture.md) — why the entry points are split three ways
- [Database](./database.md) — pool sizing, TLS and the pooler rules
- [Backend](./backend.md) — `/api/health`, `/api/version`, `/api/metrics`
