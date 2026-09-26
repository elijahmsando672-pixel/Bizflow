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
      'SELECT * FROM messages WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get messages error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM messages WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Message not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get message error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.post('/', async (req, res) => {
  try {
    const { sender_name, sender_email, subject, body } = req.body;
    if (!sender_name || !sender_email || !subject) return sendError(res, 400, 'Sender name, email and subject are required');

    const result = await query(
      `INSERT INTO messages (business_id, sender_name, sender_email, subject, body)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.business_id, sanitize(sender_name), sanitize(sender_email), sanitize(subject), sanitize(body)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create message error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { sender_name, sender_email, subject, body, is_read } = req.body;
    const result = await query(
      `UPDATE messages SET
        sender_name = COALESCE($1, sender_name),
        sender_email = COALESCE($2, sender_email),
        subject = COALESCE($3, subject),
        body = COALESCE($4, body),
        is_read = COALESCE($5, is_read)
       WHERE id = $6 AND business_id = $7 RETURNING *`,
      [sanitize(sender_name), sanitize(sender_email), sanitize(subject), sanitize(body), is_read, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Message not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update message error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const result = await query(
      `UPDATE messages SET is_read = true WHERE id = $1 AND business_id = $2 RETURNING *`,
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Message not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Mark message read error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM messages WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Message not found');
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    sendError(res, 500, 'Server error');
  }
});

export default router;
