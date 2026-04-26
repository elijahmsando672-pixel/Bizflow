import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js';
import { authenticate } from '../middleware/auth.js';
import Joi from 'joi';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bizflow-secret-key-change-in-production';

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  business_name: Joi.string().required(),
  phone: Joi.string(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, business_id: user.business_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register - creates both user AND business (multi-tenant)
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, business_name, phone } = value;

    // Check if email exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create business first
    const businessResult = await query(
      'INSERT INTO businesses (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
      [business_name, email, phone]
    );
    const business_id = businessResult.rows[0].id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with owner role
    const userResult = await query(
      `INSERT INTO users (business_id, name, email, password, role) 
       VALUES ($1, $2, $3, $4, 'owner') RETURNING id, name, email, role, business_id`,
      [business_id, name, email, hashedPassword]
    );

    const user = userResult.rows[0];
    const token = generateToken(user);

    // Add default categories for the business
    await query(
      `INSERT INTO expense_categories (business_id, name) VALUES 
       ($1, 'Rent'), ($1, 'Utilities'), ($1, 'Salaries'), ($1, 'Supplies'), ($1, 'Marketing'), ($1, 'Transport'), ($1, 'Other')`,
      [business_id]
    );

    // Send welcome email (async, don't block)
    sendWelcomeEmail(email, { name: user.name, business_name }).catch(console.error);

    res.status(201).json({ 
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: business_id, name: business_name },
      token 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;

    const result = await query(
      'SELECT u.*, b.name as business_name FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpiresAt]
    );

    const { password: _, ...userData } = user;

    res.json({ 
      user: { id: userData.id, name: userData.name, email: userData.email, role: userData.role },
      business: { id: userData.business_id, name: userData.business_name },
      token,
      refreshToken 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.business_id, b.name as business_name, b.email as business_email 
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

// Forgot Password - request reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'If the email exists, a reset link will be sent' });
    }

    const resetToken = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, resetToken, expiresAt]
    );

    sendPasswordResetEmail(email, resetToken).catch(console.error);

    res.json({ message: 'If the email exists, a reset link will be sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password - with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const result = await query(
      `SELECT * FROM password_resets 
       WHERE token = $1 AND expires_at > NOW() AND used = false 
       ORDER BY created_at DESC LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetRecord = result.rows[0];
    const userResult = await query('SELECT id FROM users WHERE email = $1', [resetRecord.email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userResult.rows[0].id]);
    await query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userResult.rows[0].id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh Token - rotate and get new access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ error: 'Refresh token required' });

    const result = await query(
      `SELECT rt.*, u.id as user_id, u.name, u.email, u.role, u.business_id, b.name as business_name
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       JOIN businesses b ON u.business_id = b.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
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

    const accessToken = generateToken({
      id: oldTokenRecord.user_id,
      email: oldTokenRecord.email,
      business_id: oldTokenRecord.business_id,
      role: oldTokenRecord.role
    });

    res.json({
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;