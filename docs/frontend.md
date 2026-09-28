# Frontend reference — `client/`

Next.js 16.2 App Router, React 19.2, TypeScript 5, Tailwind CSS v4. Runs on
:3000.

> **`client/AGENTS.md` warns that this Next.js version has breaking changes**
> relative to older training data. Read
> `client/node_modules/next/dist/docs/` before relying on an App Router API
> from memory, and watch for deprecation notices.

## Layout

```
client/
├── Dockerfile
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json          shadcn/ui config
├── netlify.toml
└── src/
    ├── app/                 ~100 routes
    ├── components/          layout, ui, dashboard, reports, auth, marketing
    ├── hooks/               useCountUp, useInView
    ├── lib/                 api, auth-context, navigation, registry, …
    └── types/               shared TS types
```

## Provider stack

`src/app/layout.tsx` composes providers in a fixed order:

```tsx
<html>                              ← Poppins + Geist Mono via next/font
  <body>
    <StyledComponentsRegistry>      ← SSR style collection for styled-components
      <AuthProvider>                ← lib/auth-context.tsx
        <Providers>                 ← app/providers.tsx
```

`Providers` (`src/app/providers.tsx`) is the app chrome boundary:

```tsx
<ThemeProvider>
  <ToastProvider>
    <AppFrame>{children}</AppFrame>
```

`AppFrame` (`src/components/layout/app-frame.tsx`) is the **single decision
point** for whether a route gets the sidebar and topbar. It keeps a
`PUBLIC_ROUTES` set and renders bare children for anything in it:

```
/  /login  /signup  /register  /reset-password  /accept-invite
/verify-email  /select-shop  /modules  /features  /about
/pricing  /contact
```

plus anything starting with `/auth`. Everything else is wrapped in `AppShell`.

**To add a route that must render without the app chrome, add it to
`PUBLIC_ROUTES`.** Anything not listed is wrapped automatically.

The shell itself:

| Component | Role |
|-----------|------|
| `app-shell.tsx` | Sidebar + topbar + content region |
| `app-sidebar.tsx` | Renders `NAVIGATION` |
| `app-topbar.tsx` | Breadcrumb, search, notifications |
| `app-command-menu.tsx` | ⌘K palette |
| `app-location-switcher.tsx` | Multi-shop / branch switcher |
| `app-notifications.tsx` | Unread badge and list |
| `app-user-menu.tsx` | Avatar, profile, sign out |

## Routing

Two generations coexist.

### Current — under `/dashboard`

The live navigation points here. ~50 routes:

```
/dashboard                          overview
/dashboard/sales                    all sales
/dashboard/sales/new                point of sale
/dashboard/orders                   orders
/dashboard/customers                customers
/dashboard/customers/new
/dashboard/products                  products
/dashboard/inventory                stock audit
/dashboard/inventory/new
/dashboard/stocks                   stock levels
/dashboard/stocks/low               low-stock alerts
/dashboard/stocks/new
/dashboard/categories               categories
/dashboard/credit                   credit ledger
/dashboard/credit/transactions
/dashboard/expenses                 expenses
/dashboard/expenses/categories
/dashboard/expenses/new
/dashboard/revenue                  cashflow / revenue
/dashboard/budgets  /dashboard/budgets/new
/dashboard/payments                M-Pesa
/dashboard/payments/agents
/dashboard/payments/reports
/dashboard/payments/transactions
/dashboard/suppliers
/dashboard/shops  /dashboard/shops/new  /dashboard/shops/types
/dashboard/transfers                inter-shop transfers
/dashboard/reports
/dashboard/analytics
/dashboard/automation
/dashboard/marketing
/dashboard/dispatch
/dashboard/settings  /dashboard/settings/releases
```

### Legacy — flat top-level routes

Still routable, kept for deep links and older bookmarks:

```
/sales  /products  /customers  /invoices  /expenses  /orders  /projects
/crm  /pipeline  /procurement  /support  /employees  /timetracking
/reports  /debtors  /creditors  /reviews  /messages  /notifications
/team  /users  /permissions  /profile  /settings  /categories
/documents  /documents/expiring  /data-import  /ai  /analytics
/admin  /shops  /inventory
```

New work should go under `/dashboard`.

### Public and auth routes

```
(public)/            →  /  /about  /features  /pricing  /contact
/login  /signup  /register
/auth  /auth/callback        OAuth callback
/reset-password  /accept-invite  /verify-email  /select-shop
```

`(public)` is a **route group** — the parenthesised segment adds no URL
segment, so `(public)/about/page.tsx` serves `/about`.

### Route files

| File | Purpose |
|------|---------|
| `layout.tsx` | Root: fonts, metadata, providers, registry |
| `error.tsx` | Route-level error boundary |
| `global-error.tsx` | Last-resort boundary for layout failures |
| `loading.tsx` | Route-level suspense fallback |
| `dashboard/error.tsx` | Dashboard-scoped boundary |
| `dashboard/loading.tsx` | Dashboard-scoped fallback |

## The API client — `src/lib/api.ts`

**This is the only file in the app that calls `fetch`.** Add every new endpoint
here rather than in a component.

### Base URL and timeout

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const DEFAULT_TIMEOUT_MS = 30000;
```

Each call goes through `fetchWithTimeout`, which composes the caller's
`AbortSignal` with a 30 s `AbortController`.

### Auth

- Bearer token read from `localStorage.token` on every call
- `credentials: 'include'` on every call, so the httpOnly refresh cookie rides
  along

### CSRF

For any non-`GET`/`HEAD` method, `csrf_token` is read out of
`document.cookie` and sent as `X-Csrf-Token`. On a `403`, the client makes one
attempt to `GET /auth/csrf-token`, updates the header, and replays the request
(`api.ts:54-82`).

### Automatic refresh

On `401` (`api.ts:84-126`):

```
POST /auth/refresh-token
  ├─ success → store the new access token, replay the original request once
  └─ failure → clear token/user/business from localStorage, redirect to /login
```

Concurrent 401s share a single in-flight refresh: a module-level
`refreshPromise` is set on the first failure and cleared in `.finally`, so ten
parallel requests trigger one refresh, not ten.

### Typed payload interfaces

The file declares the request shapes next to their methods — `RegisterData`,
`CustomerData`, `ProductData`, `SaleData`, `InvoiceData`, `ExpenseData`,
`ShopData`, `MpesaAgentData`, `SendOTPData`. Add a new interface here rather
than inlining a type at the call site.

Notable contract details, all enforced server-side:

- `SaleData` omits `total`, `subtotal` and `tax_amount` — the server derives
  them. `PUT` only applies `status` and `notes`.
- `ExpenseData` uses `category_id` (a UUID); the response carries
  `category_name`. There is no `category` string.
- `InvoiceData.customer_id` must be a real customer UUID or omitted for a
  walk-in, and at least one line item is required.
- `MpesaTransactionFilters.status` is named `status` on the wire but means
  `entry_type`.

### Organisation

The exported `api` object is grouped by domain, mirroring the backend routes:

```
api.auth  api.sales  api.products  api.customers  api.invoices  api.expenses
api.dashboard  api.notifications  api.team  api.users  api.employees
api.creditors  api.debtors  api.reports  api.ai  api.crm  api.pipeline
api.support  api.projects  api.procurement  api.timetracking
api.permissions  api.shops  api.reviews  api.messages  api.quotations
api.admin  api.payments.mpesa  api.importExport
```

## Other `lib/` modules

| File | Purpose |
|------|---------|
| `auth-context.tsx` | `useAuth()` — `user`, `business`, `shop`, `login`, `register`, `logout`, `refresh` |
| `navigation.ts` | `NAVIGATION: NavGroup[]` — drives the sidebar |
| `registry.tsx` | styled-components `ServerStyleSheet` for SSR |
| `validators.ts` | Zod schemas shared by forms |
| `format.ts` | Currency, dates, numbers |
| `csv.ts` | PapaParse import/export |
| `data.ts` | Data-loading hooks |
| `usePage.ts` | Page-level data orchestration |
| `theme-provider.tsx` | Light/dark |
| `utils.ts` | `cn()` — `clsx` + `tailwind-merge` |

## Navigation tree

`NAVIGATION` in `src/lib/navigation.ts` is a 393-line tree of seven groups:

| Group | Items |
|-------|-------|
| **Main** | Dashboard |
| **Sales** | Point of Sale, Sales, Customers, Credit |
| **Inventory** | Products, Inventory, Transfers |
| **Finance** | Expenses, Budgets, M-Pesa |
| **Insights** | Reports |
| **Management** | Documents, Notifications, Users |
| **Business** | *(business-scoped admin entries)* |
| **System** | Settings |

Each `NavItem` carries `id`, `label`, `href`, a Lucide `icon`, optional
`matchPrefixes` (so nested routes keep the parent highlighted) and optional
`children` for a submenu:

```ts
{
  id: "sales",
  label: "Sales",
  href: "/dashboard/sales",
  icon: ShoppingCart,
  matchPrefixes: ["/dashboard/sales", "/dashboard/orders"],
  children: [
    { label: "All Sales", href: "/dashboard/sales" },
    { label: "Point of Sale", href: "/dashboard/sales/new" },
    { label: "Orders", href: "/dashboard/orders" },
  ],
}
```

**Adding a page means adding a `NAVIGATION` entry too**, or it will be
unreachable from the UI.

## UI primitives

`src/components/ui/` — 26 components, shadcn/ui conventions (Radix underneath,
`components.json` present, CVA for variants):

```
avatar  badge  button  card  data-table  dialog  dropdown-menu  empty-state
form-field  input  label  page-header  pagination  panel  progress
segmented-control  select  skeleton  spinner  stat-card  status-badge
table  tabs  textarea  toast  tooltip
```

`data-table.tsx` and `table.tsx` are the two to reach for on list screens;
`page-header.tsx` and `panel.tsx` set page structure; `stat-card.tsx` for
dashboard KPIs.

`src/components/dashboard/` has `dashboard-panels.tsx` and
`sales-overview.tsx`; `src/components/reports/` holds report widgets.

## Dev proxy

`next.config.ts` rewrites `/api/:path*` to `NEXT_PUBLIC_API_URL/:path*`, so in
development the browser can call same-origin `/api/...` and Next proxies to
:5000. Cookies and CSRF behave as they do in production.

A second rewrite forwards `/auth/:path*` to the API origin — but **only when
`NEXT_PUBLIC_API_URL` is absolute**. With the relative `/api` used on Vercel,
`API_ORIGIN` is empty and a rewrite would point Next at itself, so the rewrite
is skipped and `vercel.json` handles the forwarding instead.

Other notable config:

- `output: 'standalone'` off Vercel, on everywhere else — this is what the
  Docker image's `node server.js` entrypoint needs
- `outputFileTracingRoot: __dirname` — pinned so a stray parent lockfile cannot
  make Next infer a higher root and nest the output under a prefixed path
- `turbopack.root: __dirname`
- `images.remotePatterns` allows any `https` host

## Conventions

### Adding a page

1. `src/app/<section>/page.tsx` — export metadata for the title template
2. Add the endpoint to `lib/api.ts`
3. Add a `NAVIGATION` entry in `lib/navigation.ts`
4. Forms: `react-hook-form` + a Zod schema from `lib/validators.ts`
5. Feedback: `sonner` toasts, or the `ToastProvider` from `components/ui`
6. Loading and error states via `loading.tsx` / `error.tsx` in the segment

### Styling

Tailwind v4 with `@tailwindcss/postcss`. Radix primitives for anything
interactive, `lucide-react` for icons, `cn()` to merge conditional classes.
Dark mode is class-based via `ThemeProvider`.

### Money

`NUMERIC(12,2)` arrives from Postgres as a string. Format through
`lib/format.ts` rather than interpolating directly, and never do arithmetic on
the raw value.

## There are no frontend tests

No test runner, no test files, no `test` script. CI runs `lint` and `build`
only. If you need coverage, Vitest + Testing Library is the natural fit — the
server already uses Vitest.

## Related

- [Backend](./backend.md) — every endpoint `api.ts` calls
- [Architecture](./architecture.md) — the request lifecycle end to end
- [Deployment](./deployment.md) — the standalone build and Vercel specifics
