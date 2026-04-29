import { query } from '../config/db.js';

const RESOURCES = ['customers', 'products', 'sales', 'expenses', 'invoices', 'leads', 'deals', 'tickets', 'projects', 'vendors', 'purchase_orders', 'employees', 'team', 'reports'];

const resourceRouteMap = {
  '/api/customers': 'customers',
  '/api/products': 'products',
  '/api/sales': 'sales',
  '/api/expenses': 'expenses',
  '/api/invoices': 'invoices',
  '/api/crm': 'leads',
  '/api/pipeline': 'deals',
  '/api/support': 'tickets',
  '/api/projects': 'projects',
  '/api/procurement': 'vendors',
  '/api/employees': 'employees',
  '/api/team': 'team',
  '/api/reports': 'reports',
};

const actionMap = {
  GET: 'can_read',
  POST: 'can_create',
  PUT: 'can_update',
  PATCH: 'can_update',
  DELETE: 'can_delete',
};

export const requirePermission = async (req, res, next) => {
  if (req.user.role === 'owner' || req.user.role === 'admin') {
    return next();
  }

  const method = req.method;
  const permissionKey = actionMap[method];
  if (!permissionKey) return next();

  const baseUrl = req.baseUrl;
  const resource = resourceRouteMap[baseUrl];
  if (!resource) return next();

  try {
    const result = await query(
      `SELECT ${permissionKey} FROM permissions WHERE business_id = $1 AND role_name = $2 AND resource = $3`,
      [req.business_id, req.user.role, resource]
    );

    if (!result.rows.length) {
      return res.status(403).json({ error: `Access denied: no ${permissionKey.replace('can_', '')} permission for ${resource}` });
    }

    if (!result.rows[0][permissionKey]) {
      return res.status(403).json({ error: `Access denied: no ${permissionKey.replace('can_', '')} permission for ${resource}` });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error.message);
    next();
  }
};

export const canAccessResource = async (businessId, role, resource, action) => {
  if (role === 'owner' || role === 'admin') return true;

  const permissionKey = actionMap[action];
  if (!permissionKey) return true;

  try {
    const result = await query(
      `SELECT ${permissionKey} FROM permissions WHERE business_id = $1 AND role_name = $2 AND resource = $3`,
      [businessId, role, resource]
    );
    return result.rows.length > 0 && result.rows[0][permissionKey];
  } catch {
    return false;
  }
};
