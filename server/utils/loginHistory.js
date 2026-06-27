import { query } from '../config/db.js';

export const recordLoginHistory = async ({
  userId, businessId, ip, userAgent, success,
  failureReason = null, sessionId = null,
}) => {
  try {
    const ua = userAgent || '';
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/\S+/)?.[0] || 'Unknown';
    const os = ua.match(/\(([^)]+)\)/)?.[1] || 'Unknown';
    const device = `${browser} on ${os}`;

    await query(
      `INSERT INTO login_history (user_id, business_id, ip_address, user_agent, browser, os, device, success, failure_reason, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, businessId, ip, ua, browser, os, device, success, failureReason, sessionId]
    );
  } catch (err) {
    console.error('Login history record failed:', err);
  }
};

export const getLoginHistory = async (userId, limit = 50) => {
  const r = await query(
    'SELECT * FROM login_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return r.rows;
};

export const getActiveSessions = async (userId) => {
  const r = await query(
    `SELECT lh.* FROM login_history lh
     JOIN refresh_tokens rt ON lh.session_id = rt.token
     WHERE lh.user_id = $1 AND rt.expires_at > NOW() AND lh.success = true
     ORDER BY lh.created_at DESC`,
    [userId]
  );
  return r.rows;
};
