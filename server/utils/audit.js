import { query } from '../config/db.js';

export const logAudit = async ({
  businessId,
  userId,
  action,
  resourceType,
  resourceId,
  details = {},
  ip,
  userAgent,
}) => {
  try {
    await query(
      `INSERT INTO audit_logs 
       (business_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        businessId,
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ip,
        userAgent,
      ]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
    // Don't throw - logging should never break primary flow
  }
};

// Helper to extract IP from request (considering proxy)
export const getClientIp = (req) => {
  if (req.ip) return req.ip;
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const ip = forwarded.split(',')[0].trim();
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-f:]+$/i.test(ip)) {
      return ip;
    }
  }
  return req.socket?.remoteAddress;
};
