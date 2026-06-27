import { Router } from 'express';
import { query } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { logAction } from '../utils/actionLogger.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const r = await query(
      'SELECT id, name, url, event, is_active, last_triggered_at, failure_count, created_at FROM webhooks WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, url, event, secret = null } = req.body;
    if (!name || !url || !event) throw new AppError('name, url, and event are required', 400);

    const r = await query(
      `INSERT INTO webhooks (business_id, name, url, secret, event, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, url, event, is_active, created_at`,
      [req.business_id, name, url, secret, event, req.user.id]
    );
    logAction({ businessId: req.business_id, userId: req.user.id, action: 'Webhook Created', result: 'success', resourceType: 'webhooks', resourceId: r.rows[0].id, details: { event }, ip: req.ip, userAgent: req.get('User-Agent') }).catch(() => {});
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'url', 'secret', 'event', 'is_active'];
    const sets = []; const vals = []; let i = 1;
    for (const [k, v] of Object.entries(req.body)) {
      if (allowed.includes(k) && v !== undefined) { sets.push(`${k}=$${i++}`); vals.push(v); }
    }
    if (!sets.length) throw new AppError('No fields to update', 400);
    vals.push(req.params.id, req.business_id);
    const r = await query(`UPDATE webhooks SET ${sets.join(', ')} WHERE id=$${i++} AND business_id=$${i} RETURNING id`, vals);
    if (!r.rows.length) throw new AppError('Webhook not found', 404);
    res.json({ success: true, message: 'Webhook updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const r = await query('DELETE FROM webhooks WHERE id = $1 AND business_id = $2 RETURNING id', [req.params.id, req.business_id]);
    if (!r.rows.length) throw new AppError('Webhook not found', 404);
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (err) { next(err); }
});

export default router;
