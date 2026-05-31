import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initDatabase } from './config/db.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import saleRoutes from './routes/sales.js';
import expenseRoutes from './routes/expenses.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import teamRoutes from './routes/team.js';
import employeeRoutes from './routes/employees.js';
import debtorRoutes from './routes/debtors.js';
import creditorRoutes from './routes/creditors.js';
import reportRoutes from './routes/reports.js';
import aiRoutes from './routes/ai.js';
import crmRoutes from './routes/crm.js';
import pipelineRoutes from './routes/pipeline.js';
import supportRoutes from './routes/support.js';
import projectRoutes from './routes/projects.js';
import procurementRoutes from './routes/procurement.js';
import timetrackingRoutes from './routes/timetracking.js';
import permissionsRoutes from './routes/permissions.js';
import importExportRoutes from './routes/importExport.js';
import userRoutes from './routes/users.js';
import oauthRoutes from './routes/oauth.js';
import { protect } from './middleware/protect.js';
import { requirePermission } from './middleware/rbac.js';


dotenv.config();

if (!process.env.DATABASE_URL) {
  const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// https redirect for prod — trust proxy needs to be on for this
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const isSecure = req.secure || forwardedProto === 'https';
    if (!isSecure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

app.use(cookieParser());

// CORS — keep this in sync with the frontend URL in .env
const allowedOrigins = [
  ...(process.env.CORS_ORIGINS?.split(',').filter(Boolean) || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]),
  ...(process.env.APP_URL ? [process.env.APP_URL.replace(/\/+$/, '')] : []),
  ...(process.env.NEXT_PUBLIC_API_URL ? [new URL(process.env.NEXT_PUBLIC_API_URL).origin] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production') {
      // In production, accept any origin that matches the APP_URL pattern
      // and log unknown origins for debugging without blocking
      if (process.env.CORS_ALLOW_ALL === 'true') {
        return callback(null, true);
      }
      // Also accept origins that start with known patterns (Vercel preview URLs etc.)
      const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
      if (appUrl && origin.startsWith(new URL(appUrl).origin)) {
        return callback(null, true);
      }
      console.warn(`Blocked CORS request from unknown origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Csrf-Token', 'X-Requested-With'],
  maxAge: 86400,
}));

// Security headers
import { securityHeaders } from './middleware/security.js';
app.use(securityHeaders);

// Compression
import compression from 'compression';
app.use(compression());

// Request size limits
app.use(express.json({ 
  limit: '500kb',
  strict: true,
  parameterLimit: 500,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '500kb',
  parameterLimit: 500,
}));

// sanitize all /api inputs
import { sanitizeInput } from './middleware/security.js';
app.use('/api', sanitizeInput);

import { globalRateLimiter, userRateLimiter, authRateLimiter, passwordResetRateLimiter, refreshTokenRateLimiter } from './middleware/security.js';
import { passport } from './config/oauth.js';
app.use('/api/health', (req, res, next) => next());
app.use('/api/auth/refresh-token', refreshTokenRateLimiter);
app.use(globalRateLimiter);

// login/register get hammered, limit them harder
app.use(['/api/auth/login', '/api/auth/register'], authRateLimiter);
app.use(['/api/auth/forgot-password', '/api/auth/reset-password'], passwordResetRateLimiter);

// per-user rate limit — 120 req / 15min
app.use('/api', userRateLimiter(120, 15 * 60 * 1000));

// all protected routes need auth + permission checks
app.use('/api/customers', protect, requirePermission, customerRoutes);
app.use('/api/products', protect, requirePermission, productRoutes);
app.use('/api/invoices', protect, requirePermission, invoiceRoutes);
app.use('/api/sales', protect, requirePermission, saleRoutes);
app.use('/api/expenses', protect, requirePermission, expenseRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/admin', protect, adminRoutes);
app.use('/api/team', protect, requirePermission, teamRoutes);
app.use('/api/employees', protect, requirePermission, employeeRoutes);
app.use('/api/debtors', protect, debtorRoutes);
app.use('/api/creditors', protect, requirePermission, creditorRoutes);
app.use('/api/reports', protect, requirePermission, reportRoutes);
app.use('/api/ai', protect, aiRoutes);
app.use('/api/crm', protect, requirePermission, crmRoutes);
app.use('/api/pipeline', protect, requirePermission, pipelineRoutes);
app.use('/api/support', protect, requirePermission, supportRoutes);
app.use('/api/projects', protect, requirePermission, projectRoutes);
app.use('/api/procurement', protect, requirePermission, procurementRoutes);
app.use('/api/timetracking', protect, timetrackingRoutes);
app.use('/api/permissions', protect, permissionsRoutes);
app.use('/api/import', protect, express.json({ limit: '10mb' }), importExportRoutes);
app.use('/api/export', protect, importExportRoutes);
app.use('/api/users', protect, requirePermission, userRoutes);

// OAuth routes (no auth middleware — passport handles it)
app.use(passport.initialize());
app.use('/auth', oauthRoutes);

// Auth routes (no CSRF, have their own protections)
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'BizFlow API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Version info - used by frontend to detect deployment mismatches
app.get('/api/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    name: 'bizflow-server',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Security.txt - contact for reporting security vulnerabilities
app.get('/.well-known/security.txt', (req, res) => {
  const securityText = `
Security Policy
===============

Reporting a Vulnerability
-------------------------
We take security seriously. If you discover a security vulnerability, please report it responsibly.

Contact: security@bizflow.co.ke
PGP Key: ${process.env.SECURITY_PGP_KEY || 'https://bizflow.co.ke/security.asc'}
Policy: https://bizflow.co.ke/security-policy

Scope: All our services and infrastructure
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(securityText.trim());
});

// Error handlers
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  // listen first so health checks pass immediately (render needs this)
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS: ${allowedOrigins.join(', ')}`);
  });

  server.timeout = 30000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 35000;

  // TODO: maybe move DB init to before listen? kept failing in CI so we retry here
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initDatabase();
      console.log('Database ready');
      return;
    } catch (error) {
      const isLast = attempt === maxRetries;
      if (!isLast) {
        const delay = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
        console.warn(`DB init attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('DB init failed after all retries:', error.message);
        // Don't exit — server stays up for health checks
      }
    }
  }
};

startServer();
