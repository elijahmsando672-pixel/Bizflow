import express from 'express';
import { query } from '../config/db.js';
import sanitizeHtml from 'sanitize-html';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

function sanitize(str) {
  return sanitizeHtml(String(str || ''), { allowedTags: [], allowedAttributes: {} });
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM reviews WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get reviews error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM reviews WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Review not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get review error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer_id, customer_name, product_id, product_name, rating, comment, status } = req.body;
    if (!customer_name || !rating) return sendError(res, 400, 'Customer name and rating are required');

    const result = await query(
      `INSERT INTO reviews (business_id, customer_id, customer_name, product_id, product_name, rating, comment, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.business_id, customer_id, sanitize(customer_name), product_id, sanitize(product_name), rating, sanitize(comment), status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create review error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { customer_id, customer_name, product_id, product_name, rating, comment, status } = req.body;
    const result = await query(
      `UPDATE reviews SET
        customer_id = COALESCE($1, customer_id),
        customer_name = COALESCE($2, customer_name),
        product_id = COALESCE($3, product_id),
        product_name = COALESCE($4, product_name),
        rating = COALESCE($5, rating),
        comment = COALESCE($6, comment),
        status = COALESCE($7, status)
       WHERE id = $8 AND business_id = $9 RETURNING *`,
      [customer_id, sanitize(customer_name), product_id, sanitize(product_name), rating, sanitize(comment), status, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Review not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update review error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM reviews WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Review not found');
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Delete review error:', err);
    sendError(res, 500, 'Server error');
  }
});

export default router;
