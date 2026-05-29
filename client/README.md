# BizFlow — Frontend

Next.js App Router frontend for BizFlow business management system.

## Running

```bash
npm run dev     # development (Turbopack)
npm run build   # production build
npm start       # production server
npm run lint    # ESLint
```

## Environment

Copy `.env.example` to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Structure

```
src/
├── app/              # App Router pages and layouts
│   ├── login/        # Sign-in with email/password + Google/Apple OAuth
│   ├── signup/       # Registration
│   ├── analytics/    # Business analytics with Recharts
│   ├── dashboard/    # Main dashboard views
│   └── ...           # Feature pages (sales, products, CRM, etc.)
├── components/
│   ├── layout/       # Sidebar, Topbar, MainLayout
│   └── ui/           # Card, Button, Input, Badge, Skeleton, etc.
└── lib/
    ├── auth-context.tsx   # Auth state, login/register/logout
    ├── api.ts             # HTTP client with CSRF + auto-refresh
    ├── theme-provider.tsx # Light/dark mode
    └── utils.ts           # cn() helper
```
