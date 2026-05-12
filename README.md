# BizFlow - Business Management System

Modern business management dashboard built with Next.js, Express, and PostgreSQL.

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
- Email: `elijah@bizflow.com`
- Password: `test123`

## Architecture

### Security
- **JWT access tokens** (15min) + **httpOnly refresh tokens** (7 days, cookie-only, no XSS exposure)
- **CSRF protection** via double-submit cookie pattern
- **Rate limiting** — global (100/15min), auth (5/15min), refresh (20/15min), password reset (3/hour)
- **Argon2id** password hashing with bcrypt fallback for legacy hashes
- **Helmet** security headers, HSTS in production, HTTPS redirect
- **Input sanitization** — strips null bytes and control characters
- **Account lockout** after 5 failed login attempts (15min window)
- **Audit logging** for auth events

### Error Handling
- Error boundaries (`error.tsx`, `global-error-error.tsx`) on frontend
- Structured server error responses with `console.error` logging
- 401 interceptor redirects to `/login` on refresh token failure

## Features
- **Dashboard** — Revenue, expenses, profit tracking, charts
- **Sales & Invoicing** — Create sales, manage invoices, receipt generation
- **CRM** — Customer management, lead tracking
- **Inventory** — Product management, stock tracking, low-stock alerts, restock budgeting
- **Projects** — Project management with tasks
- **Procurement** — Purchase orders, vendor management
- **Support** — Ticket management
- **Team** — Team members, roles, RBAC permissions
- **Time Tracking** — Track work hours
- **Expenses** — Expense categories, cashflow tracking
- **Reports** — Profit/loss, tax summaries
- **AI Insights** — Business predictions (requires Google API key)
- **Subscriptions** — Manage billing plans

## Tech Stack
- **Frontend**: Next.js 16.2.4 (Turbopack), React 19, TypeScript, Tailwind CSS
- **Backend**: Express, PostgreSQL, JWT + httpOnly refresh tokens, Argon2id
- **Validation**: Zod (frontend), Joi (backend)
- **Deployment**: Vercel (frontend), Docker / Railway (backend)

## Project Structure
```
Bizflow/
├── client/          # Next.js frontend (port 3000)
├── server/          # Express API (port 5000)
├── scripts/         # CI/validation scripts
├── docker-compose.yml
└── .env.example
```
