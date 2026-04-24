import express from 'express';
import { query, pool } from '../config/db.js';
import { authenticate } from './auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { category_id, start_date, end_date } = req.query;
    let sql = `SELECT e.*, ec.name as category_name 
               FROM expenses e 
               LEFT JOIN expense_categories ec ON e.category_id = ec.id 
               WHERE e.business_id = $1`;
    const params = [req.business_id];
    
    if (category_id) {
      sql += ` AND e.category_id = $${params.length + 1}`;
      params.push(category_id);
    }
    
    if (start_date) {
      sql += ` AND e.date >= $${params.length + 1}`;
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ` AND e.date <= $${params.length + 1}`;
      params.push(end_date);
    }
    
    sql += ' ORDER BY e.date DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM expenses WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { category_id, description, amount, date, vendor, reference, is_receipt_attached, notes } = req.body;
    
    if (!description || !amount) {
      return res.status(400).json({ error: 'Description and amount are required' });
    }
    
    const result = await client.query(
      `INSERT INTO expenses (business_id, category_id, description, amount, date, vendor, reference, is_receipt_attached, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.business_id, category_id, description, amount, date || new Date(), vendor, reference, is_receipt_attached, notes, req.user.id]
    );

    // Record cashflow outflow
    if (amount > 0) {
      await client.query(
        `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
         VALUES ($1, 'outflow', $2, $3, $4, 'expense', $5)`,
        [req.business_id, amount, date || new Date(), description, result.rows[0].id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { category_id, description, amount, date, vendor, reference, is_receipt_attached, notes } = req.body;
    
    const result = await query(
      `UPDATE expenses 
       SET category_id = COALESCE($1, category_id), description = COALESCE($2, description), amount = COALESCE($3, amount),
           date = COALESCE($4, date), vendor = COALESCE($5, vendor), reference = COALESCE($6, reference),
           is_receipt_attached = COALESCE($7, is_receipt_attached), notes = COALESCE($8, notes), updated_at = NOW()
       WHERE id = $9 AND business_id = $10
       RETURNING *`,
      [category_id, description, amount, date, vendor, reference, is_receipt_attached, notes, req.params.id, req.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/categories/list', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM expense_categories WHERE business_id = $1 ORDER BY name',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const result = await query(
      'INSERT INTO expense_categories (business_id, name, description, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.business_id, name, description, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;