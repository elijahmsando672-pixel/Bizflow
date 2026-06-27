import { query } from '../config/db.js';

export const logAction = async ({
  businessId,
  userId,
  action,
  result,
  resourceType,
  resourceId,
  details = {},
  ip,
  userAgent,
}) => {
  try {
    const ua = userAgent || '';
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/\S+/)?.[0] || 'Unknown';
    const os = ua.match(/\(([^)]+)\)/)?.[1] || 'Unknown';
    const device = `${browser} on ${os}`;

    await query(
      `INSERT INTO action_logs (business_id, user_id, action, result, resource_type, resource_id, details, ip_address, browser, device)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [businessId, userId, action, result, resourceType, resourceId, details, ip, browser, device]
    );
  } catch (err) {
    console.error('Action log failed:', err);
  }
};

export const actionLogger = (action, options = {}) => {
  return (req, res, next) => {
    if (!req.user) return next();
    const result = options.resultFromRes ? (res.statusCode < 400 ? 'success' : 'failure') : options.result || 'success';
    logAction({
      businessId: req.user.business_id,
      userId: req.user.id,
      action,
      result,
      resourceType: options.resourceType,
      resourceId: req.params?.id || null,
      details: options.details || {},
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.get('User-Agent'),
    }).catch(() => {});
    next();
  };
};
