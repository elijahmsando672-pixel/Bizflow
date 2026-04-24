import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ========== MODULE 1: CUSTOMERS ==========

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, phone, address, company, notes, credit_limit } = req.body;
    const result = await query(
      `INSERT INTO customers (business_id, name, email, phone, address, company, notes, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.business_id, name, email, phone, address, company, notes, credit_limit || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, email, phone, address, company, notes, credit_limit } = req.body;
    const result = await query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, company=$5, notes=$6, credit_limit=$7, updated_at=NOW()
       WHERE id=$8 AND business_id=$9 RETURNING *`,
      [name, email, phone, address, company, notes, credit_limit, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('DELETE FROM customers WHERE id=$1 AND business_id=$2 RETURNING id', [req.params.id, req.business_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;