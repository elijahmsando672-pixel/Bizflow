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

### Client (`client/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:5000/api`) |
