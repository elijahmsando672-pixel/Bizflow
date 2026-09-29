import { query } from '../config/db.js';
import { ADMIN_ONLY_RESOURCES, RESOURCES, isPrivileged } from '../config/roles.js';
import { sendError } from '../utils/sendError.js';

export { RESOURCES };

export const resourceRouteMap = {
  '/api/customers': 'customers',
  '/api/products': 'products',
  '/api/sales': 'sales',
  '/api/expenses': 'expenses',
  '/api/invoices': 'invoices',
  '/api/dashboard': 'reports',
  '/api/notifications': 'notifications',
  '/api/admin': 'admin',
  '/api/debtors': 'debtors',
  '/api/creditors': 'creditors',
  '/api/reports': 'reports',
  '/api/ai': 'reports',
  '/api/crm': 'leads',
  '/api/pipeline': 'deals',
  '/api/support': 'tickets',
  '/api/projects': 'projects',
  '/api/procurement': 'vendors',
  '/api/employees': 'employees',
  '/api/team': 'team',
  '/api/permissions': 'permissions',
  '/api/users': 'users',
  '/api/timetracking': 'timetracking',
  '/api/shops': 'shops',
  '/api/reviews': 'reviews',
  '/api/messages': 'messages',
  '/api/quotations': 'invoices',
  '/api/payments': 'payments',
  '/api/webhooks': 'webhooks',
  '/api/api-keys': 'api_keys',
};

const actionMap = {
  GET: 'can_read',
  HEAD: 'can_read',
  POST: 'can_create',
  PUT: 'can_update',
  PATCH: 'can_update',
  DELETE: 'can_delete',
};

export const resolvePermissionResource = (baseUrl, path = '') => {
  const normalizedBase = baseUrl.replace(/^\/api\/v\d+/, '/api');
  const mappedResource = resourceRouteMap[normalizedBase];
  if (mappedResource) return mappedResource;

  if (normalizedBase === '/api/import' || normalizedBase === '/api/export') {
    const requestedResource = path.split('/').filter(Boolean).at(-1);
    return RESOURCES.includes(requestedResource) ? requestedResource : null;
  }

  return null;
};

export const requirePermission = async (req, res, next) => {
  if (isPrivileged(req.user.role)) {
    return next();
  }

  const method = req.method;
  if (method === 'OPTIONS') return next();
  const permissionKey = actionMap[method];
  if (!permissionKey) return sendError(res, 403, 'Access denied: unsupported permission action');

  const resource = resolvePermissionResource(req.baseUrl, req.path);
  if (!resource) return sendError(res, 403, 'Access denied: route has no permission mapping');

  // Checked by name rather than by row lookup. These resources are deliberately
  // unseedable, so "no matching row" would be the only thing protecting them —
  // and the permissions rows are writable through /api/permissions itself.
  if (ADMIN_ONLY_RESOURCES.includes(resource)) {
    return sendError(res, 403, 'Access denied: admin access required');
  }

  try {
    const result = await query(
      `SELECT ${permissionKey} FROM permissions WHERE business_id = $1 AND role_name = $2 AND resource = $3`,
      [req.business_id, req.user.role, resource]
    );

    if (!result.rows.length) {
      return sendError(res, 403, `Access denied: no ${permissionKey.replace('can_', '')} permission for ${resource}`);
    }

    if (!result.rows[0][permissionKey]) {
      return sendError(res, 403, `Access denied: no ${permissionKey.replace('can_', '')} permission for ${resource}`);
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error.message);
    return sendError(res, 500, 'Access check failed');
  }
};
