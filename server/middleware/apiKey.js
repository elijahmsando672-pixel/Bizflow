import crypto from 'crypto';
import { query } from '../config/db.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

export const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return next();

  const prefix = apiKey.substring(0, 8);
  const keyHash = hashKey(apiKey);

  try {
    const cacheKey = `apikey:${keyHash}`;
    let keyData = cacheGet(cacheKey);
    if (!keyData) {
      const result = await query(
        `SELECT k.*, b.status as business_status
         FROM api_keys k JOIN businesses b ON k.business_id = b.id
         WHERE k.key_hash = $1 AND k.is_active = true
         AND (k.expires_at IS NULL OR k.expires_at > NOW())`,
        [keyHash]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid API key', code: 401 });
      }
      keyData = result.rows[0];
      cacheSet(cacheKey, keyData, 300000);
    }

    if (keyData.business_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Business account is suspended', code: 403 });
    }

    const ip = req.ip || req.socket?.remoteAddress;
    if (keyData.ip_whitelist && keyData.ip_whitelist.length > 0) {
      if (!keyData.ip_whitelist.includes(ip)) {
        return res.status(403).json({ success: false, message: 'IP not whitelisted for this API key', code: 403 });
      }
    }

    req.apiKey = keyData;
    req.business_id = keyData.business_id;
    req.user = { id: keyData.created_by, business_id: keyData.business_id, role: 'api', apiKeyId: keyData.id };

    query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [keyData.id]).catch(() => {});
    next();
  } catch (err) {
    console.error('API key auth error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error', code: 500 });
  }
};

export const requireApiKeyScope = (scope) => {
  return (req, res, next) => {
    if (!req.apiKey) return next();
    const scopes = req.apiKey.scopes || [];
    if (scopes.includes('*') || scopes.includes(scope)) return next();
    return res.status(403).json({ success: false, message: `API key missing required scope: ${scope}`, code: 403 });
  };
};

export const generateApiKey = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const prefix = raw.substring(0, 8);
  const hash = hashKey(raw);
  return { raw: `bf_${raw}`, hash, prefix: `bf_${prefix}` };
};
