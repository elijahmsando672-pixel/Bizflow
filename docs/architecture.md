# Architecture

## System topology

### Local development

```
  Browser
     │  http://localhost:3000
     ▼
┌──────────────────────────────┐
│  client/  Next.js 16         │  App Router, Turbopack
│  React 19 + Tailwind v4      │
└──────────────┬───────────────┘
               │  fetch  (NEXT_PUBLIC_API_URL, default /api)
               ▼
┌──────────────────────────────┐
│  server/  Express 4          │  :5000
│  app.js builds the app       │
│  index.js binds the port     │
└──────────────┬───────────────┘
               │  node-postgres (pg)
               ▼
┌──────────────────────────────┐
│  PostgreSQL 15+              │  :5433 from Docker, :5432 bare metal
│  ~70 tables                  │
└──────────────────────────────┘
```

### Production (Vercel + Supabase)

```
  Browser
     │  https://bizflow.vercel.app
     ▼
┌─────────────────────────────────────────────────────────┐
│  Vercel project (single origin)                         │
│                                                         │
│  client/.next  ────────────────────  React pages       │
│  api/index.js       ─┐                                 │
│  api/[...path].js   ─┴─► server/app.js (Express)       │
│                            │                            │
│  rewrite /auth/:path* ────► /api/_auth/:path*          │
└────────────────────────────┼────────────────────────────┘
                             │  pg → pooler :6543
                             ▼
                  Supabase PostgreSQL (transaction pooler)
```

The single-origin layout matters: because `/api/*` never leaves the domain,
cookie-based auth needs no CORS and `credentials: 'include'` works without
`SameSite=None` gymnastics. See [Deployment](./deployment.md).

## Three entry points, one Express app

`server/app.js` builds and exports the Express application. It **never binds a
port and never runs DDL**. Two thin wrappers sit on top of it:

| Entry | Runs when | What it adds |
|-------|-----------|--------------|
| `server/index.js` | `node server/index.js` — Docker, Render, Railway, a VM | `app.listen(5000)`, optional schema init, graceful shutdown |
| `api/index.js` | Vercel request to `/api` | `maxDuration: 30`, config warnings |
| `api/[...path].js` | Vercel request to `/api/*` | Identical to `api/index.js` |

`server/index.js:9-16` decides whether it owns the process by comparing
`import.meta.url` against `pathToFileURL(process.argv[1])`. Importing it — as
tests and the Vercel functions do — has no side effects.

```
server/index.js  ──imports──►  server/app.js  ──imports──►  routes, middleware, config
                                                       │
api/index.js      ──imports──►  server/app.js            │
api/[...path].js  ──imports──►  server/vercel-handler.js ┘
```

`server/vercel-handler.js` is the serverless adapter. It does three things
before delegating to Express:

1. **Rejects oversized bodies with `413`.** Vercel caps request bodies at 4.5 MB,
   below the 10 MB the import endpoint accepts. The limit is
   `PLATFORM_BODY_LIMIT_BYTES` (default `4608000`).
2. **Restores the path for OAuth.** `vercel.json` rewrites `/auth/:path*` to
   `/api/_auth/:path*` so the catch-all function receives it; the handler maps
   `/api/_auth/*` back to `/auth/*` before Express sees it.
3. **Calls `app(req, res)`** directly.

## Request lifecycle

Every `/api/*` request passes through this chain, in order
(`server/app.js:110-201`):

```
1.  HTTPS redirect            production only, honours x-forwarded-proto
2.  cookieParser              reads the httpOnly refreshToken cookie
3.  cors                      allowlist = CORS_ORIGINS + APP_URL + API origin
4.  securityHeaders           helmet, HSTS in production
5.  compression
6.  express.json              500 KB limit, parameterLimit 500
7.  express.urlencoded        500 KB limit
8.  sanitizeInput             strips null bytes and control characters
9.  xssPrevent                sanitize-html on string bodies
10. authenticateApiKey        allows X-API-Key instead of a JWT
11. trackRequest              wraps res.end for /api/metrics
12. authRateLimiter           5 / 15 min   on /api/auth/login|register
13. passwordResetRateLimiter  3 / hour     on forgot|reset-password
14. refreshTokenRateLimiter   20 / 15 min  on /api/auth/refresh-token
15. globalRateLimiter         100 / 15 min
16. userRateLimiter           120 / 15 min per user
17. suspicious-access probe   logs 403/429 responses
```

Then, per router (`mountRoutes` at `server/app.js:204-252`):

```
protect  →  requirePermission  →  auditCrud(resource)  →  router
```

The order of the rate limiters is deliberate: the narrow auth limiters run
**before** `globalRateLimiter` so login attempts do not consume the global
quota.

### Route versioning

`mountRoutes('/api')` and `mountRoutes('/api/v1')` register the same ~37 routers
on both prefixes. There is no version negotiation — both shapes always work, so
clients can migrate at their own pace.

Unversioned extras:

| Path | Purpose |
|------|---------|
| `/` | Service banner |
| `/api/health` | `SELECT 1`; `503` when config is incomplete. Used by Docker and Render |
| `/api/version` | Build metadata; the client uses it to detect deployment skew |
| `/api/metrics` | Pool and request metrics, admin/owner only |
| `/api/docs` | Swagger UI |
| `/api/swagger.json` | OpenAPI document |
| `/.well-known/security.txt` | Security contact |
| `/auth/*` | OAuth callbacks (outside `/api` because of the Vercel rewrite) |

## Authentication

Two tokens with deliberately different lifetimes and storage:

| | Access token | Refresh token |
|---|---|---|
| Lifetime | 15 minutes | 7 days |
| Storage | `localStorage.token` | `httpOnly` cookie |
| Sent as | `Authorization: Bearer` | automatic (`credentials: 'include'`) |
| Readable by JS | yes | **no** — not exposed to XSS |

Flow:

```
POST /api/auth/login
  ├─ verify credentials (Argon2id, bcrypt fallback for legacy hashes)
  ├─ account lockout check: 5 failures in 15 min → lock
  ├─ issue access token (15 min) → response body
  ├─ issue refresh token (7 d)   → httpOnly cookie, SHA-256 hashed at rest
  └─ audit log + login history

subsequent request
  ├─ Authorization: Bearer <access token>
  └─ middleware/protect.js verifies, sets req.user

access token expires → 401
  └─ client POSTs /api/auth/refresh-token
       ├─ server hashes the cookie, looks up the row, rotates it
       ├─ new access token in the body, new refresh cookie
       └─ client retries the original request
        (client/src/lib/api.ts:84-126)

refresh fails → localStorage cleared, hard redirect to /login
```

Supporting auth features:

- **CSRF** — double-submit cookie. The client reads `csrf_token` from
  `document.cookie` and sends it as `X-Csrf-Token` on every non-GET request
  (`client/src/lib/api.ts:38-46`). A `403` triggers one automatic token refresh
  and retry (`client/src/lib/api.ts:54-82`). `/api/auth` is exempt.
- **TOTP** — `/api/auth/totp/setup`, `/verify-setup`, `/disable`, with backup
  codes in `totp_backup_codes`.
- **OTP login** — `/api/auth/send-otp`, `/api/auth/verify-otp-login`,
  `/api/auth/verify-otp-reset` via `otplib` over email or SMS.
- **OAuth** — Google, Apple, Microsoft via Passport. Strategies only activate
  when their credentials are present in the environment.
- **Device & IP management** — `/api/auth/devices`, `/api/auth/ip-whitelist`.
- **API keys** — `authenticateApiKey` accepts an `X-API-Key` header in place of
  a JWT, with per-key scopes and an optional IP allowlist (`api_keys` table).

## Multi-tenancy

Every business-scoped table carries a `business_id` foreign key. Isolation is
enforced in the data-access layer, not in the router:

- `middleware/protect.js` verifies the JWT and populates `req.user`, including
  `req.user.business_id`.
- `middleware/rbac.js` (`requirePermission`) checks the role's permission
  matrix for the resource and action.
- Every query filters on the tenant. Route handlers read the id off `req.user`,
  never off a request body or query parameter, so a caller cannot ask for
  another business's rows.

### Role model

`users.role` is a `VARCHAR(20)` defaulting to `'staff'`
(`server/config/db.js:168`). Roles are **hierarchical**, defined by `ROLE_RANK`
in `server/routes/team.js:21` and `server/routes/users.js:14`:

```js
const ROLE_RANK = { staff: 1, accountant: 1, manager: 2, admin: 3, owner: 4 };
```

`staff` and `accountant` sit at the same rank. An actor may only act on a target
whose rank is **less than or equal to** their own (`outranks`), which is what
stops a `manager` from editing an `admin`. `outranks` is enforced in three
places: `GET /team/:id/role` requires at least `manager`, inviting a member
rejects a role above your own, and `POST /users` requires at least `manager`.

### The permission matrix

Authorization is a separate, database-driven layer. The `permissions` table
(`server/config/db.js:1089`) holds one row per
`(business_id, role_name, resource)` with four booleans:

| Column | Meaning |
|--------|---------|
| `can_read` | `GET` |
| `can_create` | `POST` |
| `can_update` | `PUT` / `PATCH` |
| `can_delete` | `DELETE` |

Constrained `UNIQUE(business_id, role_name, resource)`; indexed on
`(business_id, role_name)`.

`server/middleware/rbac.js` exposes:

- `requirePermission` — the route guard, mounted after `protect`
- `canAccessResource(businessId, role, resource, action)` — programmatic check
- `RESOURCES` — the 15 governed resources

Three behaviours worth knowing:

1. **`owner` and `admin` bypass the matrix entirely** — `requirePermission`
   returns `next()` before it ever queries (`rbac.js:37`).
2. **HTTP method maps to permission** via `actionMap`: `GET → can_read`,
   `POST → can_create`, `PUT`/`PATCH → can_update`, `DELETE → can_delete`.
   Any other method passes through unchecked.
3. **A base URL with no entry in `resourceRouteMap` is allowed.** The map
   (`rbac.js:8-26`) covers only 15 prefixes. An unmapped one falls through with
   `next()`, so new routers are unprotected by default — add them to the map
   when you add the router.

### Default matrix

Seeded lazily on the first `GET /api/permissions/permissions` for a business
(`server/routes/permissions.js:32-53`):

| Role | create | read | update | delete |
|------|:------:|:----:|:------:|:------:|
| `admin` | ✓ | ✓ | ✓ | ✓ |
| `manager` | ✓ | ✓ | ✓ | — |
| `staff` | ✓ | ✓ | — | — |
| `viewer` | — | ✓ | — | — |

Overrides are edited at `/permissions` in the UI, which writes through
`PUT /api/permissions/permissions/:id` or
`POST /api/permissions/permissions/bulk`.

> **Two role vocabularies coexist and they do not fully overlap.**
> `DEFAULT_ROLES` in `permissions.js:8` is
> `['admin', 'manager', 'staff', 'viewer']`, but `ROLE_RANK` in
> `team.js:21` / `users.js:14` is
> `{ staff, accountant, manager, admin, owner }`.
> Consequences: `viewer` is seeded with permission rows but **cannot be
> assigned to a user** (Joi rejects it), and `accountant` is assignable but
> **never seeded**. `GET /api/permissions/roles` merges both lists, so the UI
> shows roles that cannot actually be granted. Treat the role list as
> `staff < accountant < manager < admin < owner` and be aware that
> `owner` and `accountant` have no permission-matrix rows.

## Frontend architecture

```
client/src/
├── app/                 App Router file-based routing (~100 pages)
│   ├── layout.tsx       root: fonts, metadata, providers, styled-components SSR registry
│   ├── (public)/        marketing pages — landing, about, features, pricing, contact
│   ├── login/ signup/   auth screens with their own layouts
│   ├── dashboard/       the authenticated application
│   └── */page.tsx       ~70 top-level feature pages (legacy flat routes still present)
├── components/
│   ├── layout/          app-shell, app-sidebar, app-topbar, command menu, user menu
│   ├── ui/              26 primitives — button, card, table, dialog, select, tabs…
│   ├── dashboard/       dashboard-specific panels
│   ├── reports/         report widgets
│   ├── auth/            auth-specific components
│   └── marketing/       public-site sections
├── lib/
│   ├── api.ts           the typed API client — the only place fetch is called
│   ├── auth-context.tsx React context: user, business, shop, login/logout
│   ├── navigation.ts    NAVIGATION tree — drives the sidebar
│   ├── registry.tsx     styled-components SSR registry
│   ├── validators.ts    Zod schemas shared by forms
│   ├── format.ts        currency, dates, numbers
│   ├── csv.ts           PapaParse import/export helpers
│   ├── data.ts          data-loading hooks
│   ├── usePage.ts       page-level data orchestration
│   └── theme-provider.tsx  light/dark
├── hooks/               useCountUp, useInView
└── types/               shared TS types
```

Two generations of routes coexist:

- **`/dashboard/*`** — current. The live sidebar links here.
- **`/dashboard`'s flat siblings** (`/sales`, `/products`, `/customers`,
  `/invoices`, `/expenses`, …) — older routes, still routable, mostly
  redirecting or kept for deep links.

Adding a page means adding a route under `app/`, and — if it belongs in the
sidebar — an entry in `lib/navigation.ts`. See [Frontend](./frontend.md).

## Data flow for a typical write

```
PosPage (client/src/app/dashboard/sales/new)
  │  react-hook-form + Zod validation
  ▼
api.sales.create(data)                      client/src/lib/api.ts:305
  │  Authorization: Bearer <token>
  │  X-Csrf-Token: <cookie>
  ▼
POST /api/sales                             server/routes/sales.js
  │  sanitizeInput → rate limit → protect → requirePermission → auditCrud
  ▼
server/services/saleService.js:createSale()
  │  Joi schema validation (server/utils/schemas.js)
  │  BEGIN                                        saleService.js:162
  │    subtotal = Σ (qty × unit_price − discount)
  │    taxAmount = subtotal × 0.16                saleService.js:176
  │    total     = subtotal + tax − discount      saleService.js:177
  │    INSERT INTO sales
  │    INSERT INTO sale_items
  │    UPDATE products SET stock_qty = stock_qty − qty
  │  COMMIT                                      saleService.js:204
  ▼
200 { success, data }
  │  sonner toast, invalidate local state
```

Three invariants are enforced **server-side only**: totals and the 16% VAT rate
are always derived from the line items, stock is always decremented inside the
same transaction as the sale, and the tenant id always comes from the JWT. The
client never sends a trusted `total` — `SaleData` in
`client/src/lib/api.ts:170-185` deliberately omits `total`, `subtotal` and
`tax_amount`.

> Only `sales` and `invoices` have a dedicated service layer
> (`server/services/`). Every other domain puts its queries inline in the route
> module. Follow the local convention of whichever file you are editing, and
> prefer extracting a service when a route passes ~150 lines.

## Observability

| Signal | Where |
|--------|-------|
| Structured errors | `server/middleware/errorHandler.js` → `server/utils/sendError.js` |
| Audit log | `audit_logs` table, written by `logAudit` and the `auditCrud` middleware |
| Action log | `action_logs` table via `server/utils/actionLogger.js` |
| Login history | `login_history` via `server/utils/loginHistory.js` |
| Metrics | `/api/metrics` (admin) — pool stats, latency percentiles, error rate |
| Job queue | `GET /api/queue` (admin) — `server/utils/jobQueue.js` |
| Security monitor | `server/utils/securityMonitor.js` — periodic 403/429 scan |
| Frontend errors | `error.tsx`, `global-error.tsx`, `dashboard/error.tsx` |
| Health | `GET /api/health` |

### Response shapes: read this before writing a client call

**The API is not consistent about response envelopes, and this trips up new
code.**

**Errors** always go through `server/utils/sendError.js`, which emits a fixed
shape:

```json
{ "success": false, "message": "Access denied: no delete permission for sales", "code": 403 }
```

**Successes** mostly do *not* use an envelope. Across `server/routes/`, 143
call sites are a bare `res.json(result)` returning the domain object or array
directly; only about 13 use `{ success: true, data }`. Concretely:

| Call | Returns |
|------|---------|
| `GET /api/sales` | the sales array, directly |
| `GET /api/products` | the products array, directly |
| `GET /api/dashboard` | a stats object, directly |
| `GET /api/permissions/permissions` | permission rows, directly |
| `POST /api/team/invite` | `{ success: true, data: … }` |
| `GET /api/admin/stats` | `{ success: true, data: … }` |

`client/src/lib/api.ts` therefore does **not** unwrap: it returns
`response.json()` verbatim, and each call site destructures whatever shape its
endpoint returns. When you add an endpoint, follow whichever convention the
neighbouring routes in that file use — and be aware that a 403 from
`requirePermission` arrives as `{ success: false, message }` while a
not-found from the route itself may arrive as a bare object.

## Related

- [Backend reference](./backend.md) — every route module, middleware and utility
- [Frontend reference](./frontend.md) — component and page conventions
- [Deployment](./deployment.md) — how the topology changes per host
