import express from 'express';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js';
import { auditLogger } from '../middleware/security.js';
import { setCsrfCookie, clearCsrfCookie } from '../middleware/csrf.js';
import { JWT_SECRET_KEY as JWT_SECRET } from '../middleware/auth.js';
import { authenticate } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const router = express.Router();

// Security: Failed login tracking constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Helper: Check if IP/email is temporarily locked
const isLocked = async (email, ip) => {
  const cutoff = new Date(Date.now() - ATTEMPT_WINDOW_MS);
  const result = await query(
    `SELECT COUNT(*) as failed_count 
     FROM login_attempts 
     WHERE email = $1 AND ip_address = $2 AND success = false AND attempted_at > $3`,
    [email, ip, cutoff]
  );
  return result.rows[0].failed_count >= MAX_LOGIN_ATTEMPTS;
};

// Helper: Record login attempt
const recordLoginAttempt = async (email, ip, success) => {
  await query(
    'INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)',
    [email, ip, success]
  );
};

// Validation schemas with tightened requirements
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(10)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^a-zA-Z0-9]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least: one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 10 characters long',
    }),
  business_name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s-]+$/).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, business_id: user.business_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );
};

// Generate secure refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ========================
// AUTH ROUTES
// ========================

// Register - creates both user AND business (multi-tenant)
router.post('/register', auditLogger('auth.register'), async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, business_name, phone } = value;

    // Check if email exists (generic message to prevent email enumeration)
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Invalid registration details' });
    }

    // Create business first
    const businessResult = await query(
      'INSERT INTO businesses (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
      [business_name, email, phone]
    );
    const business_id = businessResult.rows[0].id;

    // Hash password with Argon2id
    const hashedPassword = await hashPassword(password);

    // Create user with owner role
    const userResult = await query(
      `INSERT INTO users (business_id, name, email, password, role) 
       VALUES ($1, $2, $3, $4, 'owner') RETURNING id, name, email, role, business_id`,
      [business_id, name, email, hashedPassword]
    );

    const user = userResult.rows[0];
    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpiresAt]
    );

    // Add default categories for the business
    await query(
      `INSERT INTO expense_categories (business_id, name) VALUES 
       ($1, 'Rent'), ($1, 'Utilities'), ($1, 'Salaries'), ($1, 'Supplies'), ($1, 'Marketing'), ($1, 'Transport'), ($1, 'Other')`,
      [business_id]
    );

    // Log successful registration
    await recordLoginAttempt(email, req.ip, true);

    // Send welcome email (async)
    sendWelcomeEmail(email, { name: user.name, business_name }).catch(console.error);

    // Set HTTP-only refresh token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    // Set CSRF token for frontend
    setCsrfCookie(req, res);

    res.status(201).json({ 
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: business_id, name: business_name },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login with rate limiting and lockout protection
router.post('/login', auditLogger('auth.login'), async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;
    const ip = req.ip || req.connection.remoteAddress;

    // Check for account lockout
    if (await isLocked(email, ip)) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please try again later.' 
      });
    }

    const result = await query(
      'SELECT u.*, b.name as business_name FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      await recordLoginAttempt(email, ip, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      await recordLoginAttempt(email, ip, false);
      
      if (await isLocked(email, ip)) {
        return res.status(429).json({ 
          error: 'Account temporarily locked due to too many failed attempts. Please try again later.' 
        });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Invalidate all existing refresh tokens to prevent session fixation and concurrent logins
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

    // Successful login - clear failed attempts
    await query(
      'DELETE FROM login_attempts WHERE email = $1 AND ip_address = $2 AND success = false',
      [email, ip]
    );

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpiresAt]
    );

    await recordLoginAttempt(email, ip, true);

    const { password: _, ...userData } = user;

    // Set refresh token as HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    // Set CSRF token
    setCsrfCookie(req, res);

    res.json({ 
      user: { id: userData.id, name: userData.name, email: userData.email, role: userData.role },
      business: { id: userData.business_id, name: userData.business_name },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user info
router.get('/me', authenticate, auditLogger('auth.me'), async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.business_id, 
              b.name as business_name, b.email as business_email, b.phone, b.address, b.tax_id
       FROM users u JOIN businesses b ON u.business_id = b.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout - invalidate refresh token
router.post('/logout', authenticate, auditLogger('auth.logout'), async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    // Clear cookies
    res.clearCookie('refreshToken', { 
      path: '/api/auth', 
      httpOnly: true, 
      sameSite: 'strict' 
    });
    clearCsrfCookie(res);

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password - request reset (rate limited)
router.post('/forgot-password', auditLogger('auth.forgot-password'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !Joi.string().email().validate(email).error) {
      // Always return same message regardless of email existence
      return res.json({ message: 'If the email exists in our system, a password reset link will be sent.' });
    }

    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'If the email exists in our system, a password reset link will be sent.' });
    }

    // Hash the reset token before storing
    const resetToken = generatePasswordResetToken();
    const tokenHash = await hashPassword(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, tokenHash, expiresAt]
    );

    // Send email with the UNHASHED token (only time it's visible)
    sendPasswordResetEmail(email, resetToken).catch(console.error);

    res.json({ message: 'If the email exists in our system, a password reset link will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password - with token
router.post('/reset-password', auditLogger('auth.reset-password'), async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Get all unexpired, unused reset records for this token
    const result = await query(
      `SELECT * FROM password_resets 
       WHERE expires_at > NOW() AND used = false 
       ORDER BY created_at DESC`,
      []
    );

    // Find matching token by comparing hash
    let resetRecord = null;
    for (const record of result.rows) {
      const valid = await verifyPassword(token, record.token);
      if (valid) {
        resetRecord = record;
        break;
      }
    }

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userResult = await query('SELECT id FROM users WHERE email = $1', [resetRecord.email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate password complexity
    const passwordValidation = Joi.string()
      .min(10)
      .pattern(/[a-z]/)
      .pattern(/[A-Z]/)
      .pattern(/[0-9]/)
      .pattern(/[^a-zA-Z0-9]/)
      .validate(password);
    
    if (passwordValidation.error) {
      return res.status(400).json({ 
        error: 'Password must be at least 10 characters with uppercase, lowercase, number, and special character' 
      });
    }

    const hashedPassword = await hashPassword(password);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userResult.rows[0].id]);
    await query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userResult.rows[0].id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout - invalidate refresh token
router.post('/logout', authenticate, auditLogger('auth.logout'), async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    // Clear cookie
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh Token - rotate and get new access token (reads from cookie)
router.post('/refresh-token', auditLogger('auth.refresh-token'), async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const result = await query(
      `SELECT rt.*, u.id as user_id, u.name, u.email, u.role, u.business_id, b.name as business_name
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       JOIN businesses b ON u.business_id = b.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const oldTokenRecord = result.rows[0];

    await query('DELETE FROM refresh_tokens WHERE id = $1', [oldTokenRecord.id]);

    const newRefreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [oldTokenRecord.user_id, newRefreshToken, refreshExpiresAt]
    );

    // Update cookie with new refresh token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    // Do NOT rotate CSRF token on refresh (avoid breaking parallel requests)
    // CSRF token remains valid until logout or expiration (24h)

    const userForToken = { id: oldTokenRecord.user_id, email: oldTokenRecord.email, business_id: oldTokenRecord.business_id, role: oldTokenRecord.role };
    const accessToken = generateToken(userForToken);

    res.json({
      token: accessToken,
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get fresh CSRF token (for SPA initialization)
router.get('/csrf-token', (req, res) => {
  const token = setCsrfCookie(req, res);
  res.json({ csrfToken: token });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
