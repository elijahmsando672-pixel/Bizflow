# BizFlow - Business Management System

Modern business management dashboard built with Next.js, Express, and PostgreSQL.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm/yarn

### 1. Clone & Install
```bash
git clone https://github.com/elijahmsando672-pixel/Bizflow.git
cd Bizflow
npm install
cd client && npm install && cd ..
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:
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

## Login Credentials
- Email: `elijah@bizflow.com`
- Password: `test123`

## Deployment

### Frontend (Vercel)
1. Import GitHub repo to Vercel
2. Set **Root Directory** to `client/`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`
4. Deploy

### Backend (Railway)
1. Create new project on Railway
2. Connect GitHub repo
3. Set **Root Directory** to `server/`
4. Add PostgreSQL database
5. Set environment variables:
   - `PORT=5000`
   - `JWT_SECRET=your-production-secret`
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-vercel-app.vercel.app`
   - `DATABASE_URL` (auto-set by Railway PostgreSQL)
6. Deploy

## Features
- **Dashboard** - Revenue, expenses, profit tracking
- **Sales & Invoicing** - Create sales, manage invoices
- **CRM** - Customer management, lead tracking
- **Inventory** - Product management, stock tracking
- **Projects** - Project management with tasks
- **Team** - Team members, roles, permissions
- **Time Tracking** - Track work hours
- **Reports** - Profit/loss, tax summaries
- **AI Insights** - Business predictions (requires Google API key)
- **Subscriptions** - Manage billing plans

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Express, PostgreSQL, JWT auth
- **Deployment**: Vercel (frontend), Railway (backend)
