import crypto from 'crypto';

const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CSRF_COOKIE_NAME = 'csrf_token';

export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const setCsrfCookie = (req, res) => {
  const token = generateCsrfToken();
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: isProduction,
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
    path: '/',
  });
  
  return token;
};

export const clearCsrfCookie = (res) => {
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
};

// Skip CSRF check for auth routes (they're rate-limited and use Origin validation)
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/refresh-token'];

export const validateCsrf = (req, res, next) => {
  // Skip for safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
    return next();
  }

  // Skip for auth paths (they use Origin validation via CORS)
  if (AUTH_PATHS.includes(req.path)) {
    return next();
  }

  // Skip if not authenticated (unauthenticated endpoints)
  if (!req.user) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];
  
  if (!cookieToken || !headerToken) {
    return res.status(403).json({ 
      error: 'CSRF protection: Token required' 
    });
  }
  
  try {
    const tokenBuf = Buffer.from(cookieToken, 'hex');
    const headerBuf = Buffer.from(headerToken, 'hex');
    
    if (tokenBuf.length !== headerBuf.length) {
      return res.status(403).json({ error: 'CSRF protection: Invalid token' });
    }
    
    if (!crypto.timingSafeEqual(tokenBuf, headerBuf)) {
      return res.status(403).json({ error: 'CSRF protection: Token mismatch' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'CSRF protection: Invalid token format' });
  }
  
  next();
};

// Helper to check CSRF token validity without responding (for pre-flight)
export const verifyCsrfToken = (req) => {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];
  
  if (!cookieToken || !headerToken) return false;
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken, 'hex'),
      Buffer.from(headerToken, 'hex')
    );
  } catch {
    return false;
  }
};
