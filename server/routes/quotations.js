import express from 'express';
import { query } from '../config/db.js';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();

function sanitize(str) {
  return sanitizeHtml(String(str || ''), { allowedTags: [], allowedAttributes: {} });
}

async function generateQuotationNumber(businessId) {
  const result = await query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 5) AS INTEGER)), 0) + 1 as next_num
     FROM quotations WHERE business_id = $1`,
    [businessId]
  );
  const nextNum = result.rows[0].next_num;
  return `QOT-${String(nextNum).padStart(5, '0')}`;
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM quotations WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get quotations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM quotations WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get quotation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer_id, customer_name, status, subtotal, tax_amount, discount_amount, total, valid_until, notes } = req.body;
    if (!customer_name) return res.status(400).json({ error: 'Customer name is required' });

    const quotationNumber = await generateQuotationNumber(req.business_id);

    const result = await query(
      `INSERT INTO quotations (business_id, customer_id, customer_name, quotation_number, status, subtotal, tax_amount, discount_amount, total, valid_until, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.business_id, customer_id, sanitize(customer_name), quotationNumber, status || 'draft', subtotal || 0, tax_amount || 0, discount_amount || 0, total || 0, valid_until, sanitize(notes), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create quotation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { customer_id, customer_name, status, subtotal, tax_amount, discount_amount, total, valid_until, notes } = req.body;
    const result = await query(
      `UPDATE quotations SET
        customer_id = COALESCE($1, customer_id),
        customer_name = COALESCE($2, customer_name),
        status = COALESCE($3, status),
        subtotal = COALESCE($4, subtotal),
        tax_amount = COALESCE($5, tax_amount),
        discount_amount = COALESCE($6, discount_amount),
        total = COALESCE($7, total),
        valid_until = COALESCE($8, valid_until),
        notes = COALESCE($9, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND business_id = $11 RETURNING *`,
      [customer_id, sanitize(customer_name), status, subtotal, tax_amount, discount_amount, total, valid_until, sanitize(notes), req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update quotation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM quotations WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    res.json({ message: 'Quotation deleted' });
  } catch (err) {
    console.error('Delete quotation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
