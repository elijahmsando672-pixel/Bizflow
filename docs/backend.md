# Backend reference — `server/`

The Express 4 API. Plain JavaScript ESM, no build step, no TypeScript, no ORM.
Raw SQL through `pg`.

## Layout

```
server/
├── index.js            bootstrap: binds the port, optional DDL, graceful shutdown
├── app.js              builds and exports the Express app — no listen, no DDL
├── vercel-handler.js   serverless adapter used by api/*.js
├── seed.js             demo data
├── config/
│   ├── db.js           pool, isServerless, initDatabase (all ~70 tables)
│   └── oauth.js        Passport: Google, Apple, Microsoft
├── routes/             37 Express routers
├── services/           saleService.js, invoiceService.js
├── controllers/        customer, product, expense, payment, auth
├── middleware/         auth, protect, csrf, rbac, security, apiKey, cache, validate, errorHandler
├── utils/              20 utilities
├── docs/swagger.js     OpenAPI document
├── migrations/         6 numbered SQL files
├── scripts/            backup.js, init-db.js, seedDemo.js
└── tests/              Vitest + supertest
```

## Bootstrap split

`app.js` and `index.js` are deliberately separate.

| File | Binds a port | Runs DDL | Calls `process.exit` | Used by |
|------|:------------:|:--------:|:--------------------:|---------|
| `app.js` | no | no | no | everything |
| `index.js` | yes | unless `DB_AUTO_INIT=false` | yes, on missing config | `node index.js` |
| `vercel-handler.js` | no | no | no | `api/*.js` |

`index.js:9-16` uses `isDirectRun(import.meta.url)` — a `pathToFileURL`
comparison against `process.argv[1]` — so importing it (tests, serverless) has
no side effects.

`index.js:37` calls `app.listen` **before** `initDatabase()`, deliberately, so
health checks pass while the schema is still being created. It then retries DDL
up to 10 times with exponential backoff (capped at 30 s) and, on final failure,
**keeps the server up** so `/api/health` still answers.

Server timeouts (`index.js:42-44`): `timeout` 30 s, `keepAliveTimeout` 65 s,
`headersTimeout` 35 s.

## Middleware

### Chain order

Documented in [Architecture](./architecture.md#request-lifecycle). The file is
`server/app.js:110-201`.

### `server/middleware/security.js`

| Export | Detail |
|--------|--------|
| `securityHeaders` | `helmet({...})` with HSTS in production |
| `globalRateLimiter` | 100 requests / 15 min per IP |
| `authRateLimiter` | 5 / 15 min — `/api/auth/login`, `/api/auth/register` |
| `refreshTokenRateLimiter` | 20 / 15 min — `/api/auth/refresh-token` |
| `passwordResetRateLimiter` | 3 / hour — forgot/reset-password |
| `userRateLimiter(max, windowMs)` | Per-user counter, called as `(120, 15 min)`. In-memory, keyed off the JWT |
| `sanitizeInput` | Strips null bytes and control characters from body/query/params |
| `xssPrevent` | `sanitize-html` over string values in the body |
| `auditLogger(action, options)` | Generic audit helper |
| `stopRateLimitCleanup()` | Clears the sweep interval; called on shutdown |

The narrow auth limiters are registered **before** `globalRateLimiter`
(`app.js:182-186`) so a burst of login attempts cannot exhaust the global quota.

> All counters are in-process memory. On serverless they are per instance, so
> the effective limit scales with concurrency. See
> [Deployment](./deployment.md#serverless-limitations).

### `server/middleware/auth.js` → `authenticate`

Verifies the bearer token, loads the user, sets `req.user` and
`req.business_id`. Rejects with `401` on expiry or a missing user.

### `server/middleware/protect.js`

```js
export const protect = [authenticate, validateCsrf];
```

Composed, not a function. CSRF only applies to state-changing methods.

### `server/middleware/csrf.js` → `validateCsrf`

Double-submit cookie. Compares the `csrf_token` cookie against the
`X-Csrf-Token` header for `POST`/`PUT`/`PATCH`/`DELETE`. Skips `/api/auth`.
`GET /api/auth/csrf-token` issues the token.

### `server/middleware/rbac.js` → `requirePermission`

See [Architecture](./architecture.md#the-permission-matrix). Exports
`requirePermission`, `canAccessResource`, `RESOURCES`.

> **A route whose base URL is missing from `resourceRouteMap` gets no
> permission check** — the guard returns `next()`. When you mount a new router,
> add its prefix there or it is open to any authenticated member.

### `server/middleware/apiKey.js` → `authenticateApiKey`

Accepts `X-API-Key` in place of a JWT, honouring per-key scopes and the
optional `ip_whitelist` on the `api_keys` row.

### `server/middleware/errorHandler.js`

`notFoundHandler` (404) and `errorHandler`. `errorHandler` logs with
`console.error` and returns `sendError(res, 500, ...)`. Nothing is leaked to the
client beyond the message.

## Password hashing

`server/utils/password.js`:

- **Argon2id** — `memoryCost: 2**14` (16 MB), `timeCost: 2`, parallelism 1
- **bcrypt** — 10 rounds, for verifying legacy `$2b$` hashes
- Argon2 is a **native module**, loaded lazily inside a `try`/`catch`. If the
  runtime has no compatible prebuilt binary, bcrypt takes over and a warning is
  logged. Hashing is always Argon2id; only *verification* has a bcrypt path.

## Route inventory

All routers are mounted at **both** `/api/<prefix>` and `/api/v1/<prefix>`
(`server/app.js:251-252`). Paths below are relative to either.

Every router except `apiKeys`, `sessions` and `push` is wrapped in
`protect → requirePermission → auditCrud(<resource>)`.

### Core

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/health` | `SELECT 1`; `503` when config incomplete |
| `GET` | `/api/version` | Build metadata |
| `GET` | `/api/metrics` | admin/owner only |
| `GET` | `/api/docs` | Swagger UI |
| `GET` | `/api/docs/json` | OpenAPI JSON |
| `GET` | `/api/swagger.json` | Same document, separate mount |
| `GET` | `/api/queue` | Job queue stats, admin/owner only |
| `GET` | `/.well-known/security.txt` | Vulnerability contact |

### Auth — `routes/auth.js`, mounted at `/api/auth`

Exempt from CSRF; has its own rate limiters.

| Method | Path |
|--------|------|
| `POST` | `/register` |
| `POST` | `/login` |
| `GET` | `/me` |
| `POST` | `/logout` |
| `POST` | `/forgot-password` |
| `POST` | `/reset-password` |
| `POST` | `/refresh-token` |
| `GET` | `/csrf-token` |
| `GET` | `/health` |
| `POST` | `/send-otp` |
| `POST` | `/verify-otp-login` |
| `POST` | `/verify-otp-reset` |
| `POST` | `/verify-email` |
| `POST` | `/resend-verification` |
| `POST` | `/totp/setup` · `/totp/verify-setup` · `/totp/disable` |
| `GET`/`DELETE` | `/devices`, `/devices/:id` |
| `GET`/`POST`/`DELETE` | `/ip-whitelist`, `/ip-whitelist/:id` |

### OAuth — `routes/oauth.js`, mounted at `/auth` (**not** under `/api`)

| Method | Path |
|--------|------|
| `GET` | `/google`, `/google/callback` |
| `GET`/`POST` | `/apple`, `/apple/callback` |
| `GET` | `/microsoft`, `/microsoft/callback` |

Outside `/api` because Vercel rewrites `/auth/:path*` → `/api/_auth/:path*` and
`vercel-handler.js` maps it back. Apple posts its callback as a `form_post`,
hence `POST` rather than `GET`.

### Sales — `routes/sales.js` → `services/saleService.js`

| Method | Path |
|--------|------|
| `GET` | `/`, `/receipts`, `/:saleId/receipt`, `/:saleId/receipt/html`, `/:id` |
| `POST` | `/` |
| `PUT`/`DELETE` | `/:id` |

`createSale` is the reference implementation for a transactional write: computes
`subtotal` from line items, `taxAmount = subtotal × 0.16`, `total` (floored at
0), inserts the sale and its items, and decrements product stock — all inside
one `BEGIN`/`COMMIT` (`saleService.js:162-204`). `PUT /:id` only ever applies
`status` and `notes`; it does not re-price an existing sale.

### Invoices — `routes/invoices.js` → `services/invoiceService.js`

`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

### Products — `routes/products.js`

| Method | Path |
|--------|------|
| `GET` | `/`, `/categories`, `/:id`, `/:id/stock-history` |
| `POST` | `/`, `/categories` |
| `PUT`/`DELETE` | `/:id` |

`/categories` is declared **before** `/:id` so the literal segment is not
swallowed by the parameter.

### Customers — `routes/customers.js`

`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

### Expenses — `routes/expenses.js`

`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /categories/list`,
`POST /categories`

Expenses key off `category_id` (a UUID into `expense_categories`); the
human-readable `category_name` is returned, and there is no `category` string
column.

### Dashboard — `routes/dashboard.js`

`GET /`, `/revenue-chart`, `/expenses-chart`, `/profit-summary`, `/low-stock`,
`/top-products`, `/frequent-customers`, `/restock-budget` ·
`POST /restock-budget`

### Credit ledgers

`routes/debtors.js` — `GET /`, `GET /summary`, `GET /:id/invoices` ·
`POST /`, `POST /:id/invoices`, `POST /:id/payments`, `PUT /invoices/:invoiceId/pay`,
`PUT /:id`, `DELETE /:id`

`routes/creditors.js` — `GET /`, `POST /`, `POST /:id/payments`, `PUT /:id`,
`DELETE /:id`

### CRM and pipeline

`routes/crm.js` — `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`,
`POST /:id/convert`, `POST /:id/activities`

`routes/pipeline.js` — `GET /`, `GET /:id`, `GET /pipeline-summary`, `POST /`,
`PUT /:id`, `DELETE /:id`, `POST /:id/activities`, plus
`GET`/`POST`/`PUT`/`DELETE` on `/stages` and `/stages/:id`

### Support — `routes/support.js`

`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET`/`POST` on
`/:id/replies`, `GET /dashboard-stats`, `GET /sla-configs`, `PUT /sla-configs/:id`

### Projects — `routes/projects.js`

`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET`/`POST` on
`/:id/tasks`, `PUT /tasks/:taskId`

> `PUT /tasks/:taskId` is declared *after* `GET /:id`. In Express the `/tasks/`
> prefix is distinct from `/:id`, so there is no shadowing here — but any new
> literal-prefix route must be declared **before** the `:id` catch-all in the
> same router.

### Procurement — `routes/procurement.js`

`GET`/`POST`/`PUT`/`DELETE` on `/vendors` and `/vendors/:id`, and the same set
on `/purchase-orders` and `/purchase-orders/:id`

### Employees and time tracking

`routes/employees.js` — `GET /`, `GET /:id`, `GET /attendance`, `GET /:id/attendance`,
`POST /:id/clock-in`, `POST /:id/clock-out`, `POST /`, `PUT /:id`, `DELETE /:id`,
`GET /payroll`, `GET /:id/payroll`, `POST /payroll`, `PUT /payroll/:id`

`routes/timetracking.js` — `GET /`, `GET /summary`, `POST /`, `PUT /:id`,
`DELETE /:id`

### Payments — `routes/payments.js` (M-Pesa)

`GET`/`POST`/`PUT`/`DELETE` on `/mpesa/agents`, `/mpesa/agents/:id`, plus
`GET /mpesa/transactions` and `GET /mpesa/reports`

The query parameter for entry type is named `status` on the wire but represents
`entry_type` (inflow/outflow) — the client maps it explicitly
(`client/src/lib/api.ts:212-231`).

### Reports — `routes/reports.js`

`GET /profit-loss`, `/sales-report`, `/inventory-report`, `/cashflow-report`,
`/tax-summary`

### AI — `routes/ai.js`

`GET /insights`, `/predictions`, `/history`. Requires `GEMINI_API_KEY`; without
it the endpoints degrade rather than fail the build.

### Team, users, permissions

`routes/team.js` — `GET /members`, `POST /invite`, `GET /invitations`,
`DELETE /invitations/:id`, `PUT /:id/role`, `PATCH /:id`

Mounted twice (`app.js:216-217`): the public router first so an invitee without
an account can reach `POST /api/team/accept`, then the authenticated router.
There is no "remove member" endpoint — deactivation is `PATCH /:api/team/:id`
with `is_active: false`.

`routes/users.js` — `GET /`, `POST /`, `DELETE /:id`. No `PUT`; `DELETE /:id`
refuses when the target is the business `owner`.

`routes/permissions.js` — `GET /roles`, `GET /permissions`, `GET /check`,
`PUT /permissions/:id`, `POST /permissions/bulk`

### Shops, reviews, messages, quotations

`routes/shops.js` — `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

`routes/reviews.js` — `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

`routes/messages.js` — `GET /`, `GET /:id`, `POST /`, `PUT /:id`,
`PATCH /:id/read`, `DELETE /:id`

`routes/quotations.js` — `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

### Notifications and push

`routes/notifications.js` — `GET /`, `POST /:id/read`, `POST /read-all`,
`POST /send-reminder/:id`, `POST /low-stock-alert/:productId`

`routes/push.js` — `POST /subscribe`, `POST /unsubscribe`

### Sessions, API keys, webhooks

`routes/sessions.js` — `GET /history`, `GET /active`, `POST /revoke/:sessionId`,
`POST /revoke-all`

`routes/apiKeys.js` — `GET /`, `POST /`, `DELETE /:id`

`routes/webhooks.js` — `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`

### Import and export — `routes/importExport.js`

Mounted at both `/api/import` and `/api/export`. **The same router serves both
prefixes**, which is why the client nests the operation name inside `:resource`:

| Client call | Resolves to |
|-------------|-----------|
| `POST /import/import/:resource` | `POST /:resource` |
| `POST /import/import-csv/:resource` | `POST /csv/:resource` |
| `GET /export/export/:resource` | `GET /:resource` |
| `GET /import/templates/:resource` | `GET /templates/:resource` |

`/api/import` additionally gets `express.json({ limit: '10mb' })`
(`app.js:230`) — 20× the global 500 KB. On Vercel the platform caps bodies at
4.5 MB, so large imports must run on a long-running host.

## Utilities

| File | Purpose |
|------|---------|
| `db.js` | Pool, `isServerless`, `initDatabase`, `query`, `shutdown` |
| `password.js` | Argon2id hash/verify, bcrypt legacy verify |
| `email.js` | Nodemailer transport, welcome and reset templates |
| `sms.js` | SMS gateway for OTP |
| `audit.js` | `logAudit`, `getClientIp` |
| `actionLogger.js` | Writes to `action_logs` |
| `loginHistory.js` | Writes to `login_history` |
| `cache.js` | In-memory TTL cache with a sweep interval |
| `jobQueue.js` | `addJob`, `addJobBatch`, `addRepeatableJob`, `cancelRepeatableJob`, `getQueueStats`, `JOB_STATUS` |
| `metrics.js` | `trackRequest`, `getMetrics` |
| `notifications.js` | Notification fan-out |
| `pushNotifications.js` | Web-push delivery |
| `securityMonitor.js` | Periodic 403/429 scan, `reportSuspiciousAccess` |
| `webhook.js` | Outbound webhook dispatch |
| `schemas.js` | Joi schemas, shared across routes |
| `validate.js` | Generic Joi middleware |
| `sendError.js` | `sendError(res, code, message)` |
| `AppError.js` | Error class carrying a status code |
| `fileUpload.js` | Multipart handling |
| `imageProcessor.js` | `sharp` resize/encode |
| `cdn.js` | Cache-busted asset URLs |
| `tempToken.js` | Short-lived tokens for emails |

## Background jobs

`server/utils/jobQueue.js` is an in-process queue — not Bull, not Redis.

```js
JOB_STATUS = { PENDING, RUNNING, COMPLETED, FAILED }
addJob(name, data, handler, options)
addJobBatch(jobs)
addRepeatableJob(name, data, handler, cronMs)   // setInterval under the hood
cancelRepeatableJob(name)
getQueueStats()                                   // exposed at GET /api/queue
onDrained(fn)
```

`setInterval` also drives the cache sweep (`cache.js:51`), the security scan
(`securityMonitor.js:51`), and rate-limit counter cleanup
(`security.js:111`, cleared on shutdown via `stopRateLimitCleanup()`).

> `addRepeatableJob` only fires while the process is alive. On Vercel a frozen
> instance will not run it on time — drive scheduling from Vercel Cron instead.

## Validation

Joi schemas live in `server/utils/schemas.js` and are applied per route. The
generic `middleware/validate.js` wraps a schema into middleware.

Money is `NUMERIC(12,2)` in Postgres and comes back from `pg` as a **string**.
Parse it before doing arithmetic — `parseFloat(row.total)` — or you will get
silent string concatenation. `saleService.js` does this in several places; not
every route does.

## Related

- [Architecture](./architecture.md) — request lifecycle and auth flow
- [Database](./database.md) — the tables these routes query
- [Frontend](./frontend.md) — how the client calls all of the above
