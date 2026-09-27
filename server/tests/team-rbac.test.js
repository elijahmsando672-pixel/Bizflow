import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, setupDB } from './test-server.js';
import { query } from '../config/db.js';
import { hashPassword } from '../utils/password.js';

const stamp = Date.now();
const business = {
  name: 'RBAC Test Co',
  owner: { name: 'Owner One', email: `owner${stamp}@example.com` },
  password: 'Password123!',
};

let businessId;
let ownerToken;
const tokens = {};
const ids = {};

/** Creates a member in the test business and returns their id + auth token. */
async function addMember(key, role) {
  const email = `${key}${stamp}@example.com`;
  const hashed = await hashPassword(business.password);
  const result = await query(
    `INSERT INTO users (business_id, name, email, password, role, is_active, email_verified)
     VALUES ($1, $2, $3, $4, $5, TRUE, TRUE) RETURNING id`,
    [businessId, key, email, hashed, role]
  );
  ids[key] = result.rows[0].id;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password: business.password });
  tokens[key] = login.body?.token;
  return ids[key];
}

beforeAll(async () => {
  await setupDB();

  const reg = await request(app).post('/api/auth/register').send({
    name: business.owner.name,
    email: business.owner.email,
    password: business.password,
    business_name: business.name,
  });
  ownerToken = reg.body?.token;
  businessId = reg.body?.user?.business_id;

  if (!businessId) {
    const found = await query('SELECT business_id FROM users WHERE email = $1', [business.owner.email]);
    businessId = found.rows[0]?.business_id;
  }

  await addMember('admin', 'admin');
  await addMember('manager', 'manager');
  await addMember('staff', 'staff');
  await addMember('otherstaff', 'staff');
});

afterAll(async () => {
  try { await query('DELETE FROM team_invitations WHERE business_id = $1', [businessId]); } catch { /*ok*/ }
  try { await query('DELETE FROM users WHERE business_id = $1', [businessId]); } catch { /*ok*/ }
  try { await query('DELETE FROM businesses WHERE id = $1', [businessId]); } catch { /*ok*/ }
});

const asOwner = (req) => req.set('Authorization', `Bearer ${ownerToken}`);

describe('Team invitation RBAC', () => {
  it('lets an owner invite a member', async () => {
    const res = await asOwner(request(app).post('/api/team/invite')).send({
      email: `invited${stamp}@example.com`,
      role: 'staff',
    });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('staff');
  });

  it('stops a manager from granting a role above their own', async () => {
    for (const role of ['admin', 'owner']) {
      const res = await request(app)
        .post('/api/team/invite')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({ email: `escalate${role}${stamp}@example.com`, role });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/above your own/i);
    }
  });

  it('stops a manager from granting admin via /api/users', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokens.manager}`)
      .send({
        name: 'Sneaky Admin',
        email: `sneaky${stamp}@example.com`,
        password: 'Password123!',
        role: 'admin',
      });
    expect(res.status).toBe(403);
  });

  it('stops a member from changing their own role', async () => {
    const res = await request(app)
      .put(`/api/team/${ids.manager}/role`)
      .set('Authorization', `Bearer ${tokens.manager}`)
      .send({ role: 'owner' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/your own role/i);
  });

  it('stops a manager from changing the role of an admin', async () => {
    const res = await request(app)
      .put(`/api/team/${ids.admin}/role`)
      .set('Authorization', `Bearer ${tokens.manager}`)
      .send({ role: 'staff' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/at or above your own level/i);
  });

  it('stops a manager from granting owner to somebody else', async () => {
    const res = await request(app)
      .put(`/api/team/${ids.staff}/role`)
      .set('Authorization', `Bearer ${tokens.manager}`)
      .send({ role: 'owner' });
    expect(res.status).toBe(403);
  });

  it('allows a manager to move staff up to their own level', async () => {
    const res = await request(app)
      .put(`/api/team/${ids.otherstaff}/role`)
      .set('Authorization', `Bearer ${tokens.manager}`)
      .send({ role: 'manager' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('manager');
  });

  it('stops a member from changing their own access', async () => {
    const res = await request(app)
      .patch(`/api/team/${ids.staff}`)
      .set('Authorization', `Bearer ${tokens.staff}`)
      .send({ is_active: false });
    expect(res.status).toBe(403);
  });

  it('stops a manager from deactivating the owner', async () => {
    const ownerRow = await query('SELECT id FROM users WHERE business_id = $1 AND role = $2', [
      businessId,
      'owner',
    ]);
    const res = await request(app)
      .patch(`/api/team/${ownerRow.rows[0].id}`)
      .set('Authorization', `Bearer ${tokens.manager}`)
      .send({ is_active: false });
    expect(res.status).toBe(403);
  });

  it('stops the last owner from being demoted', async () => {
    const ownerRow = await query('SELECT id FROM users WHERE business_id = $1 AND role = $2', [
      businessId,
      'owner',
    ]);
    const res = await asOwner(request(app).put(`/api/team/${ownerRow.rows[0].id}/role`))
      .send({ role: 'admin' });
    // Either the self-change guard or the last-owner guard must reject this.
    expect([400, 403]).toContain(res.status);
  });

  it('never returns invitation tokens to the client', async () => {
    const res = await asOwner(request(app).get('/api/team/invitations'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((row) => {
      expect(row).not.toHaveProperty('token');
    });
  });

  it('refuses invitation management to a plain staff member', async () => {
    const list = await request(app)
      .get('/api/team/invitations')
      .set('Authorization', `Bearer ${tokens.staff}`);
    expect(list.status).toBe(403);
  });
});

describe('Invitation acceptance (unauthenticated)', () => {
  it('accepts a valid invitation without a session and issues a token', async () => {
    const email = `accept${stamp}@example.com`;
    const invite = await asOwner(request(app).post('/api/team/invite')).send({ email, role: 'staff' });
    expect(invite.status).toBe(201);

    const row = await query('SELECT token FROM team_invitations WHERE email = $1', [email]);
    const token = row.rows[0].token;

    const res = await request(app)
      .post('/api/team/accept')
      .send({ token, name: 'New Teammate', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('staff');
  });

  it('cannot replay an invitation token', async () => {
    const email = `replay${stamp}@example.com`;
    await asOwner(request(app).post('/api/team/invite')).send({ email, role: 'staff' });
    const row = await query('SELECT token FROM team_invitations WHERE email = $1', [email]);
    const token = row.rows[0].token;

    const first = await request(app)
      .post('/api/team/accept')
      .send({ token, name: 'First Claim', password: 'Password123!' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/team/accept')
      .send({ token, name: 'Second Claim', password: 'Password123!' });
    expect(second.status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    const res = await request(app)
      .post('/api/team/accept')
      .send({ token: 'a'.repeat(64), name: 'Nobody', password: 'Password123!' });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed token and a weak password', async () => {
    const badToken = await request(app)
      .post('/api/team/accept')
      .send({ token: 'not-a-token', name: 'Nobody', password: 'Password123!' });
    expect(badToken.status).toBe(400);

    const email = `weak${stamp}@example.com`;
    await asOwner(request(app).post('/api/team/invite')).send({ email, role: 'staff' });
    const row = await query('SELECT token FROM team_invitations WHERE email = $1', [email]);
    const weak = await request(app)
      .post('/api/team/accept')
      .send({ token: row.rows[0].token, name: 'Weak Pass', password: 'short' });
    expect(weak.status).toBe(400);
  });
});
