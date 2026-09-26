import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { pool, isServerless } from './config/db.js';
import { protect } from './middleware/protect.js';
import { requirePermission } from './middleware/rbac.js';
import { logAudit, getClientIp } from './utils/audit.js';
import { securityHeaders, sanitizeInput, xssPrevent, globalRateLimiter, userRateLimiter, authRateLimiter, passwordResetRateLimiter, refreshTokenRateLimiter } from './middleware/security.js';
import { reportSuspiciousAccess } from './utils/securityMonitor.js';
import { passport } from './config/oauth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sendError } from './utils/sendError.js';
import { authenticateApiKey } from './middleware/apiKey.js';
import { trackRequest, getMetrics } from './utils/metrics.js';
import { swaggerSpec } from './docs/swagger.js';
import { getQueueStats } from './utils/jobQueue.js';
import authRoutes from './routes/auth.js';
import apiKeyRoutes from './routes/apiKeys.js';
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
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import sessionRoutes from './routes/sessions.js';
import pushRoutes from './routes/push.js';
import docRoutes from './routes/docs.js';
import oauthRoutes from './routes/oauth.js';

dotenv.config();

const DEFAULT_JWT_SECRET = 'bizflow-secret-key-change-in-production';

// Configuration is reported, never enforced by exiting: a serverless function that
// calls process.exit() is killed mid-request, so the process must stay importable.
export const configuration = (env = process.env) => {
  const required = ['JWT_SECRET'];
  if (!env.DATABASE_URL && !env.SUPABASE_DB_URL && !env.SUPABASE_POOLER_URL) {
    required.push('DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD');
  }
  const missing = required.filter((key) => !env[key]);
  const warnings = [];

  if (missing.length === 0 && env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    if (env.NODE_ENV === 'production') warnings.push('JWT_SECRET is still the built-in default value');
    else warnings.push('JWT_SECRET is the default development value');
  }
  if (env.NODE_ENV === 'production' && !env.APP_URL) {
    warnings.push('APP_URL is not set, so only CORS_ORIGINS will be allowed');
  }

  return { missing, warnings, serverless: isServerless(env) };
};

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

export const allowedOrigins = [
  ...(process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]),
  ...(process.env.APP_URL ? [process.env.APP_URL.replace(/\/+$/, '')] : []),
  ...(() => { try { return process.env.NEXT_PUBLIC_API_URL ? [new URL(process.env.NEXT_PUBLIC_API_URL).origin] : []; } catch { return []; } })(),
];

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

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

app.use('/api', sanitizeInput, xssPrevent, authenticateApiKey);

// Metrics tracking — wraps res.end to capture response time
app.use('/api', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    trackRequest(req, res, Date.now() - start);
  });
  next();
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

// API versioning helper — registers routes on both /api and /api/v1
const mountRoutes = (base) => {
  app.use(`${base}/customers`, protect, requirePermission, auditCrud('customers'), customerRoutes);
  app.use(`${base}/products`, protect, requirePermission, auditCrud('products'), productRoutes);
  app.use(`${base}/invoices`, protect, requirePermission, auditCrud('invoices'), invoiceRoutes);
  app.use(`${base}/sales`, protect, requirePermission, auditCrud('sales'), saleRoutes);
  app.use(`${base}/expenses`, protect, requirePermission, auditCrud('expenses'), expenseRoutes);
  app.use(`${base}/dashboard`, protect, requirePermission, auditCrud('dashboard'), dashboardRoutes);
  app.use(`${base}/notifications`, protect, requirePermission, auditCrud('notifications'), notificationRoutes);
  app.use(`${base}/admin`, protect, requirePermission, auditCrud('admin'), adminRoutes);
  app.use(`${base}/team`, protect, requirePermission, auditCrud('team'), teamRoutes);
  app.use(`${base}/employees`, protect, requirePermission, auditCrud('employees'), employeeRoutes);
  app.use(`${base}/debtors`, protect, requirePermission, auditCrud('debtors'), debtorRoutes);
  app.use(`${base}/creditors`, protect, requirePermission, auditCrud('creditors'), creditorRoutes);
  app.use(`${base}/reports`, protect, requirePermission, auditCrud('reports'), reportRoutes);
  app.use(`${base}/ai`, protect, requirePermission, auditCrud('ai'), aiRoutes);
  app.use(`${base}/crm`, protect, requirePermission, auditCrud('crm'), crmRoutes);
  app.use(`${base}/pipeline`, protect, requirePermission, auditCrud('pipeline'), pipelineRoutes);
  app.use(`${base}/support`, protect, requirePermission, auditCrud('support'), supportRoutes);
  app.use(`${base}/projects`, protect, requirePermission, auditCrud('projects'), projectRoutes);
  app.use(`${base}/procurement`, protect, requirePermission, auditCrud('procurement'), procurementRoutes);
  app.use(`${base}/timetracking`, protect, requirePermission, auditCrud('timetracking'), timetrackingRoutes);
  app.use(`${base}/permissions`, protect, requirePermission, auditCrud('permissions'), permissionsRoutes);
  app.use(`${base}/import`, protect, requirePermission, express.json({ limit: '10mb' }), auditCrud('import'), importExportRoutes);
  app.use(`${base}/export`, protect, requirePermission, auditCrud('export'), importExportRoutes);
  app.use(`${base}/users`, protect, requirePermission, auditCrud('users'), userRoutes);
  app.use(`${base}/shops`, protect, requirePermission, auditCrud('shops'), shopRoutes);
  app.use(`${base}/reviews`, protect, requirePermission, auditCrud('reviews'), reviewRoutes);
  app.use(`${base}/messages`, protect, requirePermission, auditCrud('messages'), messageRoutes);
  app.use(`${base}/quotations`, protect, requirePermission, auditCrud('quotations'), quotationRoutes);
  app.use(`${base}/payments`, protect, requirePermission, auditCrud('payments'), paymentRoutes);
  app.use(`${base}/api-keys`, protect, auditCrud('api_keys'), apiKeyRoutes);
  app.use(`${base}/webhooks`, protect, requirePermission, auditCrud('webhooks'), webhookRoutes);
  app.use(`${base}/sessions`, protect, auditCrud('sessions'), sessionRoutes);
  app.use(`${base}/push`, protect, pushRoutes);

  app.get(`${base}/queue`, protect, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return sendError(res, 403, 'Admin access required');
    }
    res.json({ success: true, data: getQueueStats() });
  });
};

mountRoutes('/api');
mountRoutes('/api/v1');

// API docs — Swagger UI (not versioned)
app.use('/api/docs', docRoutes);
app.use('/api/swagger.json', (req, res) => { res.json(swaggerSpec); });

// OAuth routes — rate limited, passport handles auth
app.use('/auth', authRateLimiter);
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

// Health check — minimal response, no sensitive info
app.get('/api/health', async (req, res) => {
  const { missing } = configuration();
  if (missing.length > 0) {
    return sendError(res, 503, 'Service unavailable');
  }
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    sendError(res, 503, 'Service unavailable');
  }
});

// System metrics — requires authentication (admin only)
app.get('/api/metrics', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return sendError(res, 403, 'Admin access required');
    }
    const metrics = await getMetrics(pool);
    res.json({ success: true, data: metrics });
  } catch (err) { next(err); }
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
================

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

export default app;
