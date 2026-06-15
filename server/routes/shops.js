import express from 'express';
import { query } from '../config/db.js';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();

function sanitize(str) {
  return sanitizeHtml(String(str || ''), { allowedTags: [], allowedAttributes: {} });
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM shops WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get shops error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM shops WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get shop error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, location, phone, email, manager_name, opening_time, closing_time } = req.body;
    if (!name) return res.status(400).json({ error: 'Shop name is required' });

    const result = await query(
      `INSERT INTO shops (business_id, name, location, phone, email, manager_name, opening_time, closing_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.business_id, sanitize(name), sanitize(location), sanitize(phone), sanitize(email),
       sanitize(manager_name), opening_time, closing_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create shop error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, location, phone, email, status, manager_name, opening_time, closing_time } = req.body;
    const result = await query(
      `UPDATE shops SET
        name = COALESCE($1, name),
        location = COALESCE($2, location),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        status = COALESCE($5, status),
        manager_name = COALESCE($6, manager_name),
        opening_time = COALESCE($7, opening_time),
        closing_time = COALESCE($8, closing_time),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND business_id = $10 RETURNING *`,
      [sanitize(name), sanitize(location), sanitize(phone), sanitize(email),
       status, sanitize(manager_name), opening_time, closing_time,
       req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update shop error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM shops WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    res.json({ message: 'Shop deleted' });
  } catch (err) {
    console.error('Delete shop error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
