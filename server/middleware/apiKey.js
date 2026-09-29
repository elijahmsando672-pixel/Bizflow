import crypto from 'crypto';
import { query } from '../config/db.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { sendError } from '../utils/sendError.js';

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

/** Scope names a key may carry. `read` covers safe methods, `write` the rest. */
export const API_KEY_SCOPES = ['read', 'write', '*'];

/**
 * True when a key's scopes permit `permissionKey`.
 *
 * `scopes` is JSONB, so the driver hands back a parsed array. Anything that is
 * not an array of strings grants nothing: a bare string such as `"read"` would
 * otherwise satisfy a substring check, and a key with no scopes at all must not
 * read. Fails closed deliberately, since this is the only brake on a key whose
 * creator holds the role being delegated.
 */
export const apiKeyAllowsAction = (apiKey, permissionKey) => {
  const scopes = apiKey?.scopes;
  if (!Array.isArray(scopes)) return false;
  const granted = scopes.filter((scope) => typeof scope === 'string');
  if (granted.includes('*')) return true;
  if (permissionKey === 'can_read') return granted.includes('read');
  return granted.includes('write');
};

const getHashCandidates = (apiKey) => {
  const candidates = [hashKey(apiKey)];
  if (apiKey.startsWith('bf_')) candidates.push(hashKey(apiKey.slice(3)));
  return candidates;
};

export const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return next();

  const cacheKey = `apikey:${hashKey(apiKey)}`;

  try {
    let keyData = cacheGet(cacheKey);
    if (!keyData) {
      const result = await query(
        `SELECT k.*, b.status as business_status
         FROM api_keys k JOIN businesses b ON k.business_id = b.id
         WHERE k.key_hash = ANY($1::text[]) AND k.is_active = true
         AND (k.expires_at IS NULL OR k.expires_at > NOW())`,
        [getHashCandidates(apiKey)]
      );
      if (result.rows.length === 0) {
        return sendError(res, 401, 'Invalid API key');
      }
      keyData = result.rows[0];
      cacheSet(cacheKey, keyData, 300000);
    }

    if (keyData.business_status === 'suspended') {
      return sendError(res, 403, 'Business account is suspended');
    }

    const ip = req.ip || req.socket?.remoteAddress;
    if (keyData.ip_whitelist && keyData.ip_whitelist.length > 0) {
      if (!keyData.ip_whitelist.includes(ip)) {
        return sendError(res, 403, 'IP not whitelisted for this API key');
      }
    }

    req.apiKey = keyData;
    req.business_id = keyData.business_id;
    req.user = { id: keyData.created_by, business_id: keyData.business_id, role: 'api', apiKeyId: keyData.id };

    query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [keyData.id]).catch(() => {});
    next();
  } catch (err) {
    console.error('API key auth error:', err);
    return sendError(res, 500, 'Authentication error');
  }
};

export const generateApiKey = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const prefix = raw.substring(0, 8);
  const hash = hashKey(raw);
  return { raw: `bf_${raw}`, hash, prefix: `bf_${prefix}` };
};
