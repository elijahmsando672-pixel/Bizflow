import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendWelcomeEmail } from '../utils/email.js';
import { authenticate } from '../middleware/auth.js';
import Joi from 'joi';

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
    const { password: _, ...userData } = user;

    res.json({ 
      user: { id: userData.id, name: userData.name, email: userData.email, role: userData.role },
      business: { id: userData.business_id, name: userData.business_name },
      token 
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

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;