import express from 'express';
import Joi from 'joi';
import { query } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { auditLogger } from '../middleware/security.js';

const router = express.Router();

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'manager', 'staff', 'accountant').default('staff'),
  is_active: Joi.boolean().default(true),
});

router.get('/', async (req, res) => {
  try {
    const requesterRole = req.user?.role;
    if (requesterRole !== 'admin' && requesterRole !== 'manager' && requesterRole !== 'owner') {
      return res.json([{
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        is_active: true,
      }]);
    }

    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login, u.created_at
       FROM users u
       WHERE u.business_id = $1
       ORDER BY u.created_at DESC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auditLogger('users.create'), async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, role, is_active } = value;

    const existing = await query(
      'SELECT id FROM users WHERE email = $1 AND business_id = $2',
      [email, req.business_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists in your business' });
    }

    const hashedPassword = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (business_id, name, email, password, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, is_active, created_at`,
      [req.business_id, name, email, hashedPassword, role, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auditLogger('users.delete'), async (req, res) => {
  try {
    const check = await query(
      'SELECT role FROM users WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (check.rows[0].role === 'owner') {
      return res.status(403).json({ error: 'Cannot remove the business owner' });
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
