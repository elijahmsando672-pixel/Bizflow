import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

const isProduction = process.env.NODE_ENV === 'production';

// ========================
// SECURITY HEADERS
// ========================
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
  frameguard: { action: 'deny' },
  ...(isProduction && {
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
});

// ========================
// RATE LIMITING
// ========================

// Global rate limiter - general API protection
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints - prevents brute force
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login/register attempts per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
});

// Password reset rate limiter - prevents email enumeration abuse
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: { error: 'Too many password reset requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ========================
// INPUT SANITIZATION
// ========================

// Light sanitization - only strips null bytes and control characters
export const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove null bytes and control characters
      return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
    }
    if (typeof value === 'object' && value !== null) {
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = sanitizeValue(val);
      }
      return result;
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    return value;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

// ========================
// AUDIT LOGGING
// ========================
import { logAudit, getClientIp } from '../utils/audit.js';

export const auditLogger = (action, options = {}) => {
  return (req, res, next) => {
    // Collect audit data before response
    const auditData = {
      businessId: req.user?.business_id || null,
      userId: req.user?.id || null,
      action,
      resourceType: options.resourceType || null,
      resourceId: options.resourceId || null,
      details: options.details || {},
      ip: getClientIp(req) || (req.ip || req.connection?.remoteAddress),
      userAgent: req.get('User-Agent'),
    };

    // Log to console in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.log('AUDIT:', JSON.stringify(auditData));
    }

    // Fire-and-forget DB insert (don't block response)
    logAudit(auditData).catch(console.error);

    next();
  };
};
