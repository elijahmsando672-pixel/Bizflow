# Deployment

Four supported targets. The choice is essentially "where does the API run",
because the frontend is always the same Next.js build.

| Target | Frontend | API | Database |
|--------|----------|-----|----------|
| Docker Compose | `client/Dockerfile` → :3000 | `server/Dockerfile` → :5000 | `postgres:16-alpine` → **:5433** |
| Vercel + Supabase | Next.js on Vercel | `api/*.js` as a function, same origin | Supabase pooler :6543 |
| Vercel + Railway | Next.js on Vercel | Express on Railway, cross-origin | Railway Postgres |
| Render | separate | `rootDir: server` | Render Postgres |

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
`test-deployment.sh` smoke-tests a deployment.

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
`Dockerfile`, `docker-compose.yml`, `deploy.sh`, `stop.sh`, `test.html`.

`api/` and `server/` are **not** ignored — they are the function. `migration/`
is also uploaded; it is small and inert, but it is dead weight in the bundle.

### Required Vercel environment variables

```env
DATABASE_URL         transaction pooler URL, port 6543
DB_INIT_URL          direct or session connection — db:init only
DB_AUTO_INIT         false
JWT_SECRET           openssl rand -base64 64
APP_URL              https://your-app.vercel.app
NEXT_PUBLIC_API_URL  /api
CORS_ORIGINS         https://your-app.vercel.app
```

### Supabase connection notes

- Point `DATABASE_URL` at the **connection pooler**, not the direct connection.
  Vercel has no IPv6, so `db.<project>.supabase.co` is unreachable from a
  function. Use port **6543** (transaction mode) for the API and **5432** on the
  pooler host (session mode) wherever a real session is needed.
- TLS is enabled automatically for `*.supabase.co` / `*.supabase.com`.
  Certificate verification **defaults to off** for those hosts because the chain
  is not issued by a public root. Set `DB_SSL_REJECT_UNAUTHORIZED=true` to
  require it.
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
| **Rate limits are per instance** | Counters live in memory, so the effective limit grows with instance count. Use a shared store (Upstash Redis) if limits must be global |
| **Scheduled jobs do not self-trigger** | `addRepeatableJob` uses `setInterval`; a frozen instance will not run it on time. Drive from Vercel Cron |
| **Request bodies capped at 4.5 MB** | Below the 10 MB the import endpoint accepts. `vercel-handler.js` rejects oversized requests with `413` and a clear message |
| **30 s function timeout** | `maxDuration: 30`. Video processing and similar long jobs belong on a long-running host |
| **Argon2 needs a prebuilt binary** | If the runtime has no compatible native build, hashing falls back to bcrypt automatically and logs a warning |
| **No scheduled backups** | `npm run backup` needs a cron trigger or a long-running host. Supabase offers managed backups and PITR |

## Railway

`railway.json` and `railway.toml` are equivalent; both use Nixpacks:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && node index.js",
    "restartPolicyType": "always"
  }
}
```

Environment:

```env
DATABASE_URL    provided by the Railway Postgres plugin
JWT_SECRET      openssl rand -base64 64
NODE_ENV        production
CORS_ORIGINS    https://your-app.vercel.app
APP_URL         https://your-app.vercel.app
```

Then on Vercel set `NEXT_PUBLIC_API_URL` to
`https://your-app.up.railway.app/api` and redeploy.

Unlike the Vercel layout, this is **cross-origin** — the API is on a different
domain, so `CORS_ORIGINS` must list the frontend origin *with its scheme*, and
cookies are subject to `SameSite` rules. Expect to fight CORS here; the
single-origin Vercel layout avoids it entirely.

`server/index.js:35-44` binds the port before DDL and sets
`timeout` 30 s / `keepAliveTimeout` 65 s / `headersTimeout` 35 s, so a Nixpacks
or Railway health probe is not killed mid-boot.

## Render

`render.yaml` deploys only the API (`rootDir: server`) plus a Postgres instance,
and wires the database credentials in automatically:

```yaml
services:
  - type: web
    rootDir: server
    startCommand: node index.js
    healthCheckPath: /api/health
databases:
  - name: bizflow-db
```

`healthCheckPath: /api/health` is why `index.js` calls `app.listen` **before**
`initDatabase` — Render must see a listening socket immediately, and
`/api/health` must not depend on the schema being ready.

`scripts/keep-alive.sh` is a cron helper that pings the API every 10 minutes to
stop Render's free tier from idling. It is machine-specific — the crontab hint
in its comment points at a hardcoded home directory, so edit before use. It only
logs; it takes no corrective action.

## Environment variables

### Server

| Variable | Required | Purpose |
|----------|:--------:|---------|
| `JWT_SECRET` | yes | Signs access tokens. ≥32 chars. `openssl rand -base64 64` |
| `DATABASE_URL` | one of | PostgreSQL connection string. Wins over the discrete `DB_*` vars |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | one of | Used only when `DATABASE_URL` is empty |
| `DB_SSL` | no | Force TLS on or off |
| `DB_SSL_REJECT_UNAUTHORIZED` | no | Verify the cert chain. Defaults off for Supabase hosts only |
| `DB_SSL_CA` | no | Path to a CA bundle |
| `DB_INIT_URL` | no | Connection for `db:init` only |
| `DB_AUTO_INIT` | no | `false` skips DDL on boot. **Set this on serverless** |
| `DB_POOL_MAX` | no | Pool size. Defaults to 1 when `VERCEL` is set |
| `DB_POOL_IDLE_TIMEOUT_MS` / `DB_CONNECT_TIMEOUT_MS` / `DB_APPLICATION_NAME` | no | Pool tuning |
| `SUPABASE_DB_URL` / `SUPABASE_POOLER_URL` | no | Supabase shorthands, read only when `DATABASE_URL` is empty |
| `CORS_ORIGINS` | prod | Comma-separated allowed origins, **with scheme** |
| `APP_URL` | prod | The public frontend URL. Also added to the CORS allowlist |
| `NEXT_PUBLIC_API_URL` | no | Its *origin* is added to the CORS allowlist |
| `CORS_ALLOW_ALL` | no | `true` disables the production origin check |
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
- [ ] `DATABASE_URL` points at the pooler if the host is serverless
- [ ] Health endpoint returns `{"status":"ok"}` — not `503`
- [ ] Backups scheduled (cron, or a managed offering)
- [ ] Root and `client/package.json` versions match — `npm run version:sync`

## Related

- [Architecture](./architecture.md) — why the entry points are split three ways
- [Database](./database.md) — pool sizing, TLS and the pooler rules
- [Backend](./backend.md) — `/api/health`, `/api/version`, `/api/metrics`
