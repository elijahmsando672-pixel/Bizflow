import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, query } from '../config/db.js';
import { generateToken } from '../middleware/auth.js';
import { RESOURCES, ROLES } from '../config/roles.js';

/**
 * Exercises `requirePermission` over real HTTP against the real app.
 *
 * tests/test-server.js mounts a hand-rolled subset of the routes that skips the
 * permission middleware entirely, so it cannot catch a seeding or mapping
 * mistake. These tests drive app.js, which is the only place the wiring is real.
 *
 * Tokens are minted directly rather than through /api/auth/login: the auth rate
 * limiter allows five calls per IP, which is not enough to log in one member per
 * role, and the registration call is the path whose seeding is under test.
 */
const stamp = Date.now();
const PASSWORD = 'Password123!';

let businessId;
const tokenFor = {};

const authed = (role, req) => req.set('Authorization', `Bearer ${tokenFor[role]}`);

// validateCsrf runs inside `protect`, so a mutating request needs the cookie, a
// matching header, and an unexpired clock.
const csrfToken = 'a'.repeat(64);
const withCsrf = (req) => req
  .set('Cookie', `csrf_token=${csrfToken}; csrf_expiry=${Date.now() + 3_600_000}`)
  .set('X-Csrf-Token', csrfToken);

beforeAll(async () => {
  await initDatabase(3, 500);

  const reg = await request(app).post('/api/auth/register').send({
    name: 'Matrix Owner',
    email: `matrix${stamp}@example.com`,
    password: PASSWORD,
    business_name: 'Matrix Business',
  });
  expect(reg.status).toBe(201);
  // The register response nests the id under `business`, not on the user.
  businessId = reg.body.business?.id;
  expect(businessId).toBeTruthy();

  for (const role of ['admin', 'manager', 'accountant', 'staff']) {
    const created = await query(
      `INSERT INTO users (business_id, name, email, password, role, is_active, email_verified)
       VALUES ($1, $2, $3, 'unused', $4, TRUE, TRUE) RETURNING id, email, business_id, role`,
      [businessId, `Member ${role}`, `matrix-${role}${stamp}@example.com`, role],
    );
    tokenFor[role] = generateToken(created.rows[0]);
  }
  tokenFor.owner = reg.body.token;
});

afterAll(async () => {
  try { await query('DELETE FROM permissions WHERE business_id = $1', [businessId]); } catch { /*ok*/ }
  try { await query('DELETE FROM users WHERE business_id = $1', [businessId]); } catch { /*ok*/ }
  try { await query('DELETE FROM businesses WHERE id = $1', [businessId]); } catch { /*ok*/ }
});

describe('registration seeds the permission matrix', () => {
  it('creates a row for every role and resource', async () => {
    const { rows } = await query(
      'SELECT role_name, resource FROM permissions WHERE business_id = $1',
      [businessId],
    );
    const seeded = new Set(rows.map((r) => `${r.role_name}:${r.resource}`));
    for (const role of ROLES) {
      for (const resource of RESOURCES) {
        expect(seeded.has(`${role}:${resource}`), `${role}/${resource}`).toBe(true);
      }
    }
  });

  it('does not seed the admin-only resources at all', async () => {
    const { rows } = await query(
      `SELECT count(*)::int AS count FROM permissions
       WHERE business_id = $1 AND resource IN ('admin', 'permissions')`,
      [businessId],
    );
    expect(rows[0].count).toBe(0);
  });

  it('is idempotent, so a repeat call cannot duplicate a row', async () => {
    // Uses its own business on purpose: seeding the shared one here would paper
    // over a missing registration seed for every test that follows.
    const scratch = await query(
      `INSERT INTO businesses (name, email) VALUES ($1, $2) RETURNING id`,
      ['Scratch', `scratch${stamp}@example.com`],
    );
    const scratchId = scratch.rows[0].id;
    try {
      const { ensureDefaultPermissions } = await import('../utils/permissions.js');
      await ensureDefaultPermissions(scratchId);
      await ensureDefaultPermissions(scratchId);
      const { rows } = await query(
        'SELECT count(*)::int AS count FROM permissions WHERE business_id = $1',
        [scratchId],
      );
      expect(rows[0].count).toBe(ROLES.length * RESOURCES.length);
    } finally {
      await query('DELETE FROM permissions WHERE business_id = $1', [scratchId]);
      await query('DELETE FROM businesses WHERE id = $1', [scratchId]);
    }
  });
});

describe('seeded grants decide what each role can actually reach', () => {
  it.each(['admin', 'manager', 'accountant', 'staff'])('lets %s read customers', async (role) => {
    const res = await authed(role, request(app).get('/api/customers'));
    expect(res.status).toBe(200);
  });

  it.each(['manager', 'accountant', 'staff'])('lets %s create a customer', async (role) => {
    const res = await authed(role, withCsrf(request(app).post('/api/customers')))
      .send({ name: `Made by ${role}`, email: `by-${role}${stamp}@example.com` });
    expect(res.status).toBe(201);
  });

  it.each(['manager', 'accountant', 'staff'])('stops %s from deleting one', async (role) => {
    const res = await authed(role, withCsrf(request(app).delete('/api/customers/00000000-0000-0000-0000-000000000000')));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/no delete permission for customers/);
  });

  it.each(['manager', 'accountant', 'staff'])('keeps %s out of the API keys', async (role) => {
    const res = await authed(role, request(app).get('/api/api-keys'));
    expect(res.status).toBe(403);
  });

  it('lets an admin reach the API keys, since admins bypass the table', async () => {
    const res = await authed('admin', request(app).get('/api/api-keys'));
    expect(res.status).toBe(200);
  });

  it.each(['manager', 'accountant', 'staff'])('keeps %s out of the permission screen', async (role) => {
    const res = await authed(role, request(app).get('/api/permissions/permissions'));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin access required/);
  });

  it.each(['manager', 'accountant', 'staff'])('keeps %s out of user management', async (role) => {
    const res = await authed(role, request(app).get('/api/users'));
    expect(res.status).toBe(403);
  });

  it('lets a manager read the team but not manage accounts through it', async () => {
    const res = await authed('manager', request(app).get('/api/team/members'));
    expect(res.status).toBe(200);
  });

  it('reduces a staff member reading the team to themselves', async () => {
    const res = await authed('staff', request(app).get('/api/team/members'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

