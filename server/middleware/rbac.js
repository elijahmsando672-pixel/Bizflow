import { query } from '../config/db.js';
import { ADMIN_ONLY_RESOURCES, RESOURCES, isPrivileged } from '../config/roles.js';
import { apiKeyAllowsAction } from './apiKey.js';
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

/** The scope a permission flag falls under, for denials an API key caller sees. */
const scopeFor = (permissionKey) => (permissionKey === 'can_read' ? 'read' : 'write');

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

  // A key holds no role of its own. It acts for whoever minted it, so the grant
  // is looked up against that user's *current* role rather than a role frozen
  // onto the key at creation. Resolving it here, in the same query, keeps the
  // demotion path tight: a member demoted from manager to staff has their keys
  // lose manager reach on the very next request.
  const apiKey = req.apiKey ?? null;

  // Scope first, because it needs no database round trip and it is the brake
  // that stops a read-only key mutating even when the role underneath allows it.
  if (apiKey && !apiKeyAllowsAction(apiKey, permissionKey)) {
    return sendError(res, 403, `Access denied: API key lacks the ${scopeFor(permissionKey)} scope`);
  }

  const sql = apiKey
    ? `SELECT p.${permissionKey} FROM permissions p
       JOIN users u ON u.id = $2 AND u.business_id = p.business_id
       WHERE p.business_id = $1 AND p.role_name = u.role AND p.resource = $3`
    : `SELECT ${permissionKey} FROM permissions WHERE business_id = $1 AND role_name = $2 AND resource = $3`;
  const params = [req.business_id, apiKey ? apiKey.created_by : req.user.role, resource];

  try {
    const result = await query(sql, params);

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
