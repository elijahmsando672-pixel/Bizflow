# BizFlow

A modern business management dashboard for small to medium businesses.

## Features

- **Dashboard** - Overview of your business with today's sales, expenses, profit, and low stock alerts
- **Sales** - Track and manage sales transactions
- **Products** - Manage product inventory with stock levels
- **Expenses** - Track business expenses by category
- **Customers** - Manage customer relationships
- **Creditors** - Manage payable accounts
- **Reports** - Analytics and insights with charts
- **Documents** - Manage business documents
- **Notifications** - Stay updated with alerts
- **Settings** - Configure your business

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Node.js, Express, PostgreSQL
- **Database**: PostgreSQL

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

1. Clone the repository
```bash
git clone https://github.com/elijahmsando672-pixel/Bizflow.git
cd Bizflow
```

2. Install dependencies
```bash
# Frontend
cd client && npm install

# Backend (root directory)
npm install
```

3. Configure environment variables
```bash
# Edit .env file
cp .env.example .env
# Update with your database credentials
```

4. Start the development servers

**Backend** (port 5000):
```bash
npm run server
# or
node server/index.js
```

**Frontend** (port 3000):
```bash
cd client && npm run dev
```

5. Open http://localhost:3000

## Project Structure

```
Bizflow/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   └── lib/         # Utilities
│   └── package.json
├── server/                # Express backend
│   ├── config/          # Database config
│   ├── middleware/     # Auth middleware
│   ├── routes/        # API routes
│   ├── utils/         # Utilities
│   └── index.js       # Server entry
├── .env                 # Environment variables
└── package.json
```

## API Endpoints

- `GET /api/health` - Health check
- `/api/auth` - Authentication
- `/api/customers` - Customer management
- `/api/products` - Product management
- `/api/sales` - Sales transactions
- `/api/expenses` - Expense tracking
- `/api/dashboard` - Dashboard data
- `/api/notifications` - Notifications

## License

MIT