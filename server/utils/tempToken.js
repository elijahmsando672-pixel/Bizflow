import crypto from 'crypto';
import { query } from '../config/db.js';

const TTL_MS = 2 * 60 * 1000; // 2 minutes

export const createTempToken = async (userId) => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + TTL_MS);
  await query(
    'INSERT INTO temp_tokens (user_id, token_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, hash, 'totp_preauth', expiresAt]
  );
  return raw;
};

export const consumeTempToken = async (rawToken) => {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const result = await query(
    `UPDATE temp_tokens SET used = true
     WHERE token_hash = $1 AND purpose = 'totp_preauth' AND used = false AND expires_at > NOW()
     RETURNING user_id`,
    [hash]
  );
  return result.rows[0] || null;
};
