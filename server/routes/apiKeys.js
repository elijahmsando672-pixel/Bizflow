import { Router } from 'express';
import { query } from '../config/db.js';
import { API_KEY_SCOPES, generateApiKey } from '../middleware/apiKey.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

/**
 * Normalises the requested scopes, rejecting anything unrecognised.
 *
 * This is stricter than it looks on purpose: `apiKeyAllowsAction` fails closed
 * on a scope list it cannot read, so storing `"read"` as a bare string would
 * mint a key that authenticates and then 403s on every call, with nothing in
 * the response to say why. Rejecting here turns that into an explicit 400.
 */
const normalizeScopes = (scopes) => {
  if (scopes === undefined || scopes === null) return ['read'];
  if (!Array.isArray(scopes)) throw new AppError('Scopes must be an array of strings', 400);

  const cleaned = [...new Set(scopes)];
  if (cleaned.length === 0) throw new AppError('Scopes cannot be empty', 400);

  const unknown = cleaned.filter((scope) => !API_KEY_SCOPES.includes(scope));
  if (unknown.length) {
    throw new AppError(`Unknown scope(s): ${unknown.join(', ')}. Allowed: ${API_KEY_SCOPES.join(', ')}`, 400);
  }
  return cleaned;
};

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
    const granted = normalizeScopes(scopes);

    const { raw, hash, prefix } = generateApiKey();
    const result = await query(
      `INSERT INTO api_keys (business_id, name, key_hash, key_prefix, scopes, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, key_prefix, scopes, is_active, created_at`,
      [req.business_id, name, hash, prefix, JSON.stringify(granted), expires_at || null, req.user.id]
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
