import { Router } from 'express';
import { query } from '../config/db.js';
import { generateApiKey } from '../middleware/apiKey.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at
       FROM api_keys WHERE business_id = $1 ORDER BY created_at DESC`,
      [req.business_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, scopes, expires_at } = req.body;
    if (!name) throw new AppError('Name is required', 400);

    const { raw, hash, prefix } = generateApiKey();
    const result = await query(
      `INSERT INTO api_keys (business_id, name, key_hash, key_prefix, scopes, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, key_prefix, scopes, is_active, created_at`,
      [req.business_id, name, hash, prefix, scopes || ['read'], expires_at || null, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'API key created. Store this key securely — it will not be shown again.',
      data: { ...result.rows[0], key: raw },
    });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM api_keys WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (!result.rows.length) throw new AppError('API key not found', 404);
    res.json({ success: true, message: 'API key revoked' });
  } catch (err) { next(err); }
});

export default router;
