import { query } from '../config/db.js';

const alertCooldowns = new Map();

const isOnCooldown = (key, windowMs = 5 * 60 * 1000) => {
  const now = Date.now();
  const last = alertCooldowns.get(key);
  if (last && now - last < windowMs) return true;
  alertCooldowns.set(key, now);
  return false;
};

export const notifyAdminSecurity = async (businessId, title, message, type = 'security', link = null) => {
  if (!businessId) return;
  try {
    const admins = await query(
      "SELECT id FROM users WHERE business_id = $1 AND role IN ('owner', 'admin')",
      [businessId]
    );
    for (const admin of admins.rows) {
      await query(
        `INSERT INTO notifications (business_id, user_id, title, message, type, link)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [businessId, admin.id, title, message, type, link]
      );
    }
  } catch (err) {
    console.error('Security notification failed:', err.message);
  }
};

export const reportAccountLockout = async (email, ip) => {
  try {
    const userResult = await query('SELECT business_id FROM users WHERE email = $1', [email]);
    if (!userResult.rows.length) return;
    const businessId = userResult.rows[0].business_id;

    const cooldownKey = `lockout:${email}`;
    if (isOnCooldown(cooldownKey)) return;

    const title = 'Account Lockout Detected';
    const message = `Account locked for ${email} after multiple failed login attempts from IP ${ip}.`;
    await notifyAdminSecurity(businessId, title, message, 'security', null);
  } catch (err) {
    console.error('Lockout report failed:', err.message);
  }
};

const suspiciousCounters = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of suspiciousCounters.entries()) {
    if (now - record.windowStart > 15 * 60 * 1000) suspiciousCounters.delete(key);
  }
}, 10 * 60 * 1000);

export const reportSuspiciousAccess = async (businessId, ip, statusCode, email, path) => {
  if (!businessId) return;
  try {
    const counterKey = `403:${businessId}:${ip}`;
    const now = Date.now();
    let record = suspiciousCounters.get(counterKey);

    if (!record || now - record.windowStart > 15 * 60 * 1000) {
      record = { windowStart: now, count: 0 };
    }
    record.count++;
    suspiciousCounters.set(counterKey, record);

    if (record.count >= 5 && isOnCooldown(`alert:${counterKey}`, 30 * 60 * 1000)) return;

    if (record.count === 5 || record.count === 20 || record.count === 50) {
      const title = 'Suspicious Activity Detected';
      const message = `${record.count} unauthorized access attempts (${statusCode}) from IP ${ip}${email ? ` targeting ${email}` : ''} in the last 15 minutes. Path: ${path}`;
      await notifyAdminSecurity(businessId, title, message, 'security', null);
    }
  } catch (err) {
    console.error('Suspicious access report failed:', err.message);
  }
};
