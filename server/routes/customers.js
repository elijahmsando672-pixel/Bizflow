import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

// ========== MODULE 1: CUSTOMERS ==========

// All routes are automatically protected by the global `protect` middleware
// and have CSRF validation applied for state-changing methods

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json(result.rows);
   } catch (err) {
     console.error('Customers route error:', err);
     res.status(500).json({ error: 'Internal server error' });
   }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, company, notes, credit_limit } = req.body;
    const result = await query(
      `INSERT INTO customers (business_id, name, email, phone, address, company, notes, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.business_id, name, email, phone, address, company, notes, credit_limit || 0]
    );
    res.status(201).json(result.rows[0]);
   } catch (err) {
     console.error('Customers route error:', err);
     res.status(500).json({ error: 'Internal server error' });
   }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
   } catch (err) {
     console.error('Customers route error:', err);
     res.status(500).json({ error: 'Internal server error' });
   }
});

router.put('/:id', async (req, res) => {
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
     console.error('Customers route error:', err);
     res.status(500).json({ error: 'Internal server error' });
   }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM customers WHERE id=$1 AND business_id=$2 RETURNING id', [req.params.id, req.business_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
   } catch (err) {
     console.error('Customers route error:', err);
     res.status(500).json({ error: 'Internal server error' });
   }
});

export default router;