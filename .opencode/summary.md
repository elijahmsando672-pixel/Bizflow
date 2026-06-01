# Summary

## Goal
- Apply design system overhaul, build a proper landing page, refactor the monolithic dashboard SPA, and wire up a fully functional products page for BizFlow.

## Constraints & Preferences
- Use Tailwind v4 CSS variables for all theming (`--background`, `--card`, `--sidebar`, etc.)
- Dashboard SPA must remain a single-file app but use design tokens + UI components
- Sidebar must be dark regardless of user theme
- Prefer terse bullets, not prose paragraphs
- Preserve exact file paths, commands, error strings, and identifiers when known

## Progress
### Done
- **User account fixed**: user didn't exist in DB — registered fresh at `/api/auth/register`. Old password `Admin@123` was only 9 chars (min 10). New password: `Admin@1234`. Cleared 6 stale `login_attempts` rows. Verified login works.
- **Design system globals.css**: new color palette — dark (`#0F172A` bg, `#111827` sidebar, `#1E293B` card, `#3B82F6` primary, `#F8FAFC` text, `#94A3B8` muted), light (`#F8FAFC` bg, `#FFFFFF` card, `#2563EB` primary, `#0F172A` text, `#E2E8F0` border), 12px radius, soft shadows, smooth transitions
- **Sidebar.tsx**: uses `--color-sidebar` CSS var, spring-animated mobile slide-out drawer with backdrop blur, `NavGroupItem` subcomponent with active indicator
- **Topbar.tsx**: hamburger `Menu` button visible on `lg:hidden`, styled with design tokens
- **Dashboard sidebar**: updated to `bg-sidebar border-border`, mobile slide-out drawer with spring animation
- **Button.tsx**: `rounded-xl` (12px), cleaner focus rings, softer shadows, solid `bg-primary`
- **Input.tsx**: `rounded-xl`, `border-input`, `focus-visible:ring-ring/50`
- **Select.tsx**: `rounded-xl`, `border-input bg-background`, `focus:ring-ring`, `bg-card text-card-foreground shadow-dropdown`, `rounded-lg` item with `focus:bg-accent focus:text-accent-foreground`
- **DataTable component**: `ui/data-table.tsx` — search with clear button, animated filter panel with dropdown selects, column sorting, pagination (page numbers, prev/next, first/last), bulk actions (select all, individual checkboxes, delete button), export button, loading/empty states, mobile-responsive with `hideOnMobile` columns
- **Landing page (page.tsx)**: pixel-perfect match of user HTML/CSS spec — navbar, hero, stats, features, pricing, CTA, footer
- **Landing page image fix**: React `useState` (`imgError`) + placeholder with `Building2` icon instead of DOM `onError` manipulation
- **All dashboard components updated**: `dashboard-shell.tsx`, `stat-card.tsx`, `topbar.tsx`, `top-products.tsx`, `low-stock-alerts.tsx`, `restock-budget.tsx`, `revenue-chart.tsx`, `frequent-customers.tsx`, `recent-orders.tsx`, `ai-insights.tsx` — semantic Tailwind classes replacing hardcoded hex
- **Loading/error pages updated**: `dashboard/loading.tsx`, `dashboard/error.tsx`, `app/loading.tsx` — use design tokens
- **Dashboard SPA refactored** (`/dashboard/page.tsx`, 2500 lines): `C` object hex colors → CSS variable references (`var(--color-primary)`, `var(--color-border)`, etc.) — colors auto-switch with light/dark. Inline components (`Card`, `StatCard`, `Btn`, `Badge`, `SearchBar`, `Select`, `Table`, `PageHeader`, `Avatar`) rewritten with Tailwind classes + CSS vars. `Modal` → `Dialog` from `@/components/ui/dialog`. `InputField` → `Input` from `@/components/ui/input`. Sidebar: explicit dark gradient (`linear-gradient(180deg, #0a0f20, #080c1a)`) — always dark, independent of theme. `dark` class added to root wrapper for CSS variable resolution. Broken `@keyframes pulse` → Tailwind `animate-pulse`. Removed redundant `<style>` block.
- **Products page** (`/products/page.tsx`): DataTable with full CRUD — Dialog form (name, SKU, price, cost, stock, reorder, category dropdown from `api.products.getCategories()`, description), edit/delete buttons per row, calls `api.products.create()/update()/delete()`. Stats cards (total, stock value, low stock, out of stock). Export to CSV.
- **Mobile UX polish**: login page social buttons → `max-sm:grid-cols-1` stack on tiny screens
- **Server tests**: 20/20 pass (`npx vitest run` in server/)
- **Client build**: compiles with 53 static pages, zero TypeScript/ESLint errors (`npm run build` in client/)

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- **Landing page icons**: lucide-react (`Receipt`, `ChartLine`, `Box`, `ArrowLeftRight`, `Building2`) instead of Font Awesome — Font Awesome not in project dependencies
- **Dashboard image placeholder**: React `useState` with conditional rendering, not DOM `onError` manipulation — avoids hydration mismatch
- **Dashboard SPA refactor approach**: replaced `C` hex colors with CSS variable references + replaced inline component definitions with Tailwind wrappers — kept all sub-pages untouched, minimal churn. The `dark` class on root wrapper forces CSS variables to dark-mode values within the SPA.
- **Sidebar dark mode**: explicit hardcoded gradient (`#0a0f20 → #080c1a`) rather than relying on `bg-sidebar` CSS variable — ensures sidebar is always dark regardless of user theme
- **DataTable generic constraint**: `Record<string, any>` instead of `Record<string, unknown>` — required to accept simple interfaces like `Product` that lack an index signature

## Next Steps
1. Consider splitting the dashboard SPA into individual route pages (monolithic file still holds all sub-pages)
2. Add proper form validation to the product dialog
3. Consider building standalone pages for sales, customers, inventory (currently all in the dashboard SPA)

## Critical Context
- **Next.js version**: 16.2.4 (app router, server components default)
- **Tailwind CSS v4**: uses `@import "tailwindcss"` and `@theme inline` — no traditional `tailwind.config.js`
- **Login credentials**: `elijahmsando672@gmail.com` / `Admin@1234`
- **Auth rate limiter**: 5 failed attempts per IP per 15 min window (in-memory); DB lockout: 5 failed attempts per account per 15 min window (`login_attempts` table)
- **Password requirements**: min 10 chars, must include uppercase + lowercase + number + special character
- **Dashboard SPA**: 2500-line monolithic file at `client/src/app/dashboard/page.tsx` — now uses CSS variables + Tailwind + UI components, but still monolithic with all sub-pages inline
- **DataTable generic**: uses `<T extends Record<string, any>>` constraint

## Relevant Files
- `client/src/app/globals.css`: CSS variables for light/dark, scrollbar style, custom animations
- `client/src/app/page.tsx`: landing page matching user HTML/CSS spec
- `client/src/app/login/page.tsx`: login form (Tailwind classes, mobile social buttons `max-sm:grid-cols-1`)
- `client/src/app/dashboard/page.tsx`: monolithic SPA (2500 lines) — refactored with CSS vars + Tailwind + UI components
- `client/src/app/products/page.tsx`: standalone products page with DataTable + CRUD Dialog
- `client/src/components/ui/data-table.tsx`: DataTable with search, filters, sorting, pagination, bulk actions
- `client/src/components/ui/dialog.tsx`: Dialog component (used as Modal replacement)
- `client/src/components/ui/button.tsx`: Button with rounded-xl, solid bg-primary
- `client/src/components/ui/input.tsx`: Input with rounded-xl, border-input
- `client/src/components/ui/select.tsx`: Select component
- `client/src/components/ui/badge.tsx`: Badge with variants (default, destructive, warning, outline)
- `client/src/components/layout/Sidebar.tsx`: sidebar with mobile drawer animation
- `client/src/components/layout/Topbar.tsx`: topbar with hamburger on mobile
- `client/src/components/dashboard/*.tsx`: all dashboard components — updated to use design tokens
- `client/src/lib/api.ts`: API client with products CRUD + categories endpoints (lines 206-215)
- `server/routes/products.js`: server product routes — `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id`, `GET /api/products/categories`, `POST /api/products/categories`
- `server/controllers/authController.js`: login attempt tracking + password validation logic
- `server/config/db.js`: PostgreSQL pool with local Unix socket connection
