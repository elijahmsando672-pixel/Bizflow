import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';

const isProduction = process.env.NODE_ENV === 'production';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://i.pravatar.cc", "https://*.gravatar.com"],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
  frameguard: { action: 'deny' },
  noSniff: true,
  hidePoweredBy: true,
  ...(isProduction && {
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login/register attempts per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
});

export const refreshTokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many refresh attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: { error: 'Too many password reset requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user rate limiter (for authenticated routes)
const MAX_RATE_ENTRIES = 10000;
const userRateStore = new Map();
export const userRateLimiter = (maxRequests = 60, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    if (!req.user?.id) return next();
    const key = `user_${req.user.id}`;
    const now = Date.now();
    const record = userRateStore.get(key);
    if (!record || now - record.windowStart > windowMs) {
      if (userRateStore.size >= MAX_RATE_ENTRIES) {
        const oldest = userRateStore.entries().next().value;
        if (oldest) userRateStore.delete(oldest[0]);
      }
      userRateStore.set(key, { windowStart: now, count: 1 });
      return next();
    }
    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' });
    }
    next();
  };
};

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of userRateStore.entries()) {
    if (now - record.windowStart > 15 * 60 * 1000) userRateStore.delete(key);
  }
}, 10 * 60 * 1000);

// Strips ASCII control chars from input strings — data quality, NOT a security control.
// SQL injection is prevented by parameterized queries; XSS by output encoding.
export const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === 'object' && value !== null) {
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = sanitizeValue(val);
      }
      return result;
    }
    return value;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === 'string') {
        req.query[key] = val.replace(/[\x00-\x1F\x7F]/g, '').trim();
      }
    }
  }
  next();
};

const XSS_PATTERNS = /<script[\s>]|javascript\s*:|onerror\s*=|onload\s*=|onclick\s*=|onmouseover\s*=|onfocus\s*=|onblur\s*=|onsubmit\s*=|onchange\s*=|oninput\s*=|onpointerdown\s*=|onpointerup\s*=|ontouchstart\s*=|ontouchend\s*=|expression\s*\(|<embed[\s>]|<object[\s>]|<svg[\s>]|<math[\s>]|<iframe[\s>]|<link[\s>]|style\s*=/i;

export const xssPrevent = (req, res, next) => {
  const checkValue = (value) => {
    if (typeof value === 'string' && XSS_PATTERNS.test(value)) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (req.body && typeof req.body === 'object' && checkValue(req.body)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  next();
};

import { logAudit, getClientIp } from '../utils/audit.js';

export const auditLogger = (action, options = {}) => {
  return (req, res, next) => {
    const auditData = {
      businessId: req.user?.business_id || null,
      userId: req.user?.id || null,
      action,
      resourceType: options.resourceType || null,
      resourceId: options.resourceId || null,
      details: options.details || {},
      ip: getClientIp(req),
      userAgent: req.get('User-Agent'),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('AUDIT:', JSON.stringify(auditData));
    }

    logAudit(auditData).catch(console.error);

    next();
  };
};
