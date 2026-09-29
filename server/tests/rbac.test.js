import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('../config/db.js', () => ({ query: queryMock }));

import { query } from '../config/db.js';
import { DEFAULT_ROLE_PERMISSIONS, RESOURCES, ROLES, isPrivileged, outranks, rankOf } from '../config/roles.js';
import { requirePermission, resolvePermissionResource } from '../middleware/rbac.js';

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('permissions route RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['/api/permissions', '/api/v1/permissions'])(
    'denies a staff member on %s without even consulting the permissions table',
    async (baseUrl) => {
      query.mockResolvedValue({ rows: [{ can_update: true }] });
      const req = {
        baseUrl,
        business_id: 7,
        method: 'PUT',
        user: { role: 'staff' },
      };
      const res = createResponse();
      const next = vi.fn();

      await requirePermission(req, res, next);

      expect(query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    },
  );

  it.each(['admin', 'permissions'])(
    'treats %s as admin-only even when a grant exists',
    async (resource) => {
      query.mockResolvedValue({ rows: [{ can_update: true, can_read: true }] });
      const baseUrl = resource === 'admin' ? '/api/admin' : '/api/permissions';
      const req = { baseUrl, business_id: 7, method: 'GET', user: { role: 'manager' } };
      const res = createResponse();
      const next = vi.fn();

      await requirePermission(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    },
  );

  it('preserves the admin bypass for permission management', async () => {
    const req = {
      baseUrl: '/api/permissions',
      business_id: 7,
      method: 'PUT',
      user: { role: 'admin' },
    };
    const res = createResponse();
    const next = vi.fn();

    await requirePermission(req, res, next);

    expect(query).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('role vocabulary', () => {
  it('gives every invitable role a seeded permission row', () => {
    for (const role of ROLES) {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it('covers every grantable resource for every role', () => {
    for (const [role, grants] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      expect(Object.keys(grants).sort(), `role ${role}`).toEqual([...RESOURCES].sort());
    }
  });

  it('never grants api_keys or webhooks to a role that has to ask', () => {
    for (const role of ROLES.filter((r) => !['owner', 'admin'].includes(r))) {
      for (const resource of ['api_keys', 'webhooks']) {
        expect(DEFAULT_ROLE_PERMISSIONS[role][resource], `${role}/${resource}`).toEqual({
          can_create: false,
          can_read: false,
          can_update: false,
          can_delete: false,
        });
      }
    }
  });

  it('keeps user management out of reach of every delegable role', () => {
    for (const role of ['manager', 'staff', 'accountant']) {
      expect(DEFAULT_ROLE_PERMISSIONS[role].users.can_read, role).toBe(false);
    }
  });

  it('never lets a role grant one at or above its own rank', () => {
    for (const [role, grants] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      if (['owner', 'admin'].includes(role)) continue;
      for (const resource of ['users', 'team']) {
        expect(grants[resource].can_delete, `${role}/${resource}`).toBe(false);
      }
    }
  });

  it('ranks unknown roles below every real one so they grant nothing', () => {
    expect(rankOf('superuser')).toBe(0);
    expect(rankOf('viewer')).toBe(0);
    expect(outranks('superuser', 'staff')).toBe(false);
    expect(outranks('manager', 'manager')).toBe(true);
    expect(outranks('manager', 'admin')).toBe(false);
  });

  it('keeps staff and accountant peer roles, as the invite copy implies', () => {
    expect(rankOf('staff')).toBe(rankOf('accountant'));
  });

  it('treats only owner and admin as privileged, not merely senior', () => {
    // A bypass keyed off rank instead of identity would hand the skip to any
    // role added above `admin` later, which is exactly the mistake this guards.
    for (const role of ROLES) {
      expect(isPrivileged(role), role).toBe(['owner', 'admin'].includes(role));
    }
    for (const role of ['viewer', 'superuser', 'api', '', undefined, null]) {
      expect(isPrivileged(role), String(role)).toBe(false);
    }
  });
});

describe('permission backfill migration', () => {
  // 007 duplicates the matrix as literal SQL because migrations are a frozen
  // record. This pins the two together, because a drifted backfill silently
  // locks the roles it forgot about.
  const migration = readFileSync(
    new URL('../migrations/007_seed_default_permissions.sql', import.meta.url),
    'utf8',
  );

  const sqlRows = () => {
    const parsed = new Map();
    for (const [, role, resource, create, read, update, remove] of migration.matchAll(
      /\('([a-z_]+)', '([a-z_]+)', (true|false), (true|false), (true|false), (true|false)\)/g,
    )) {
      parsed.set(`${role}:${resource}`, { can_create: create === 'true', can_read: read === 'true', can_update: update === 'true', can_delete: remove === 'true' });
    }
    return parsed;
  };

  it('seeds exactly the matrix the application defines', () => {
    const expected = new Map(
      Object.entries(DEFAULT_ROLE_PERMISSIONS).flatMap(([role, grants]) =>
        Object.entries(grants).map(([resource, flags]) => [`${role}:${resource}`, flags]),
      ),
    );
    expect(sqlRows()).toEqual(expected);
  });
});

describe('protected route permission coverage', () => {
  it.each([
    ['/api/customers', 'customers'],
    ['/api/products', 'products'],
    ['/api/sales', 'sales'],
    ['/api/expenses', 'expenses'],
    ['/api/invoices', 'invoices'],
    ['/api/dashboard', 'reports'],
    ['/api/notifications', 'notifications'],
    ['/api/admin', 'admin'],
    ['/api/team', 'team'],
    ['/api/employees', 'employees'],
    ['/api/debtors', 'debtors'],
    ['/api/creditors', 'creditors'],
    ['/api/reports', 'reports'],
    ['/api/ai', 'reports'],
    ['/api/crm', 'leads'],
    ['/api/pipeline', 'deals'],
    ['/api/support', 'tickets'],
    ['/api/projects', 'projects'],
    ['/api/procurement', 'vendors'],
    ['/api/timetracking', 'timetracking'],
    ['/api/permissions', 'permissions'],
    ['/api/users', 'users'],
    ['/api/shops', 'shops'],
    ['/api/reviews', 'reviews'],
    ['/api/messages', 'messages'],
    ['/api/quotations', 'invoices'],
    ['/api/payments', 'payments'],
    ['/api/webhooks', 'webhooks'],
    ['/api/api-keys', 'api_keys'],
  ])('maps %s to the %s resource', (baseUrl, resource) => {
    expect(resolvePermissionResource(baseUrl)).toBe(resource);
    expect(resolvePermissionResource(baseUrl.replace('/api/', '/api/v1/'))).toBe(resource);
  });

  it.each([
    ['/api/import', '/customers'],
    ['/api/import', '/csv/products'],
    ['/api/export', '/templates/leads'],
  ])('resolves resource-specific transfer permissions for %s%s', (baseUrl, path) => {
    expect(resolvePermissionResource(baseUrl, path)).toBe(path.split('/').filter(Boolean).at(-1));
  });

  it('denies non-admin requests to an unmapped protected route', async () => {
    const req = {
      baseUrl: '/api/unmapped',
      path: '/',
      business_id: 7,
      method: 'GET',
      user: { role: 'staff' },
    };
    const res = createResponse();
    const next = vi.fn();

    await requirePermission(req, res, next);

    expect(query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});