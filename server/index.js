import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { initDatabase } from './config/db.js';
import { protect } from './middleware/protect.js';
import { requirePermission } from './middleware/rbac.js';
import { logAudit, getClientIp } from './utils/audit.js';
import { securityHeaders, sanitizeInput, xssPrevent, globalRateLimiter, userRateLimiter, authRateLimiter, passwordResetRateLimiter, refreshTokenRateLimiter } from './middleware/security.js';
import { reportSuspiciousAccess } from './utils/securityMonitor.js';
import { passport } from './config/oauth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
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
import shopRoutes from './routes/shops.js';
import reviewRoutes from './routes/reviews.js';
import messageRoutes from './routes/messages.js';
import quotationRoutes from './routes/quotations.js';
import oauthRoutes from './routes/oauth.js';

const auditCrud = (resource) => (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.user) {
    const action = `${req.method.toLowerCase()}.${resource}`;
    logAudit({
      businessId: req.user?.business_id || null,
      userId: req.user?.id || null,
      action,
      resourceType: resource,
      resourceId: req.params?.id || null,
      details: { path: req.originalUrl },
      ip: getClientIp(req),
      userAgent: req.get('User-Agent'),
    }).catch(console.error);
  }
  next();
};


dotenv.config();

const requiredEnvVars = ['JWT_SECRET'];
if (!process.env.DATABASE_URL) {
  requiredEnvVars.push('DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD');
}
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET === 'bizflow-secret-key-change-in-production') {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: Change the default JWT_SECRET in production for security.');
    process.exit(1);
  }
  console.warn('WARNING: Using default JWT_SECRET. Set a unique secret for security.');
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
  ...(() => { try { return process.env.NEXT_PUBLIC_API_URL ? [new URL(process.env.NEXT_PUBLIC_API_URL).origin] : []; } catch { return []; } })(),
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
      // Also accept origins that exactly match known patterns (Vercel preview URLs etc.)
      const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
      if (appUrl && origin === new URL(appUrl).origin) {
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

app.use(securityHeaders);
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

app.use('/api', sanitizeInput, xssPrevent);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Auth rate limiters must come before globalRateLimiter so they don't consume the global quota
app.use(['/api/auth/login', '/api/auth/register'], authRateLimiter);
app.use(['/api/auth/forgot-password', '/api/auth/reset-password'], passwordResetRateLimiter);
app.use('/api/auth/refresh-token', refreshTokenRateLimiter);
app.use(globalRateLimiter);

// per-user rate limit — 120 req / 15min
app.use('/api', userRateLimiter(120, 15 * 60 * 1000));

app.use('/api', (req, res, next) => {
  res.on('finish', () => {
    if ([403, 429].includes(res.statusCode)) {
      const businessId = req.user?.business_id || req.business_id || null;
      if (businessId) {
        reportSuspiciousAccess(businessId, getClientIp(req), res.statusCode, req.user?.email, req.originalUrl).catch(() => {});
      }
    }
  });
  next();
});

// all protected routes need auth + permission checks + audit logging
app.use('/api/customers', protect, requirePermission, auditCrud('customers'), customerRoutes);
app.use('/api/products', protect, requirePermission, auditCrud('products'), productRoutes);
app.use('/api/invoices', protect, requirePermission, auditCrud('invoices'), invoiceRoutes);
app.use('/api/sales', protect, requirePermission, auditCrud('sales'), saleRoutes);
app.use('/api/expenses', protect, requirePermission, auditCrud('expenses'), expenseRoutes);
app.use('/api/dashboard', protect, requirePermission, auditCrud('dashboard'), dashboardRoutes);
app.use('/api/notifications', protect, requirePermission, auditCrud('notifications'), notificationRoutes);
app.use('/api/admin', protect, requirePermission, auditCrud('admin'), adminRoutes);
app.use('/api/team', protect, requirePermission, auditCrud('team'), teamRoutes);
app.use('/api/employees', protect, requirePermission, auditCrud('employees'), employeeRoutes);
app.use('/api/debtors', protect, requirePermission, auditCrud('debtors'), debtorRoutes);
app.use('/api/creditors', protect, requirePermission, auditCrud('creditors'), creditorRoutes);
app.use('/api/reports', protect, requirePermission, auditCrud('reports'), reportRoutes);
app.use('/api/ai', protect, requirePermission, auditCrud('ai'), aiRoutes);
app.use('/api/crm', protect, requirePermission, auditCrud('crm'), crmRoutes);
app.use('/api/pipeline', protect, requirePermission, auditCrud('pipeline'), pipelineRoutes);
app.use('/api/support', protect, requirePermission, auditCrud('support'), supportRoutes);
app.use('/api/projects', protect, requirePermission, auditCrud('projects'), projectRoutes);
app.use('/api/procurement', protect, requirePermission, auditCrud('procurement'), procurementRoutes);
app.use('/api/timetracking', protect, requirePermission, auditCrud('timetracking'), timetrackingRoutes);
app.use('/api/permissions', protect, requirePermission, auditCrud('permissions'), permissionsRoutes);
app.use('/api/import', protect, requirePermission, express.json({ limit: '10mb' }), auditCrud('import'), importExportRoutes);
app.use('/api/export', protect, requirePermission, auditCrud('export'), importExportRoutes);
app.use('/api/users', protect, requirePermission, auditCrud('users'), userRoutes);
app.use('/api/shops', protect, requirePermission, auditCrud('shops'), shopRoutes);
app.use('/api/reviews', protect, requirePermission, auditCrud('reviews'), reviewRoutes);
app.use('/api/messages', protect, requirePermission, auditCrud('messages'), messageRoutes);
app.use('/api/quotations', protect, requirePermission, auditCrud('quotations'), quotationRoutes);

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

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed');
    });
    const { shutdown: shutdownDb } = await import('./config/db.js');
    await shutdownDb();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

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
