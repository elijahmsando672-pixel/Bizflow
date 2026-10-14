import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, setupDB } from './test-server.js';
import { query } from '../config/db.js';
import { removeSubscription } from '../utils/pushNotifications.js';

// A push endpoint is a long opaque URL handed out by the browser's push service. It
// used to be UNIQUE across the whole table, which made it a cross-tenant handle:
//
//   POST /api/push/unsubscribe deleted by endpoint alone, so any authenticated
//   member who knew another tenant's endpoint could remove that tenant's
//   subscription and silently stop its notifications.
//
//   POST /api/push/subscribe conflicted on that same global key, so registering an
//   endpoint another tenant already held overwrote the victim's key material while
//   leaving its business_id in place — their pushes then failed at the push service.
//
// Both are the bug class tenant isolation exists to prevent: a request-supplied
// value reaching a tenant table with no business_id predicate. Uniqueness now
// belongs to (business_id, endpoint) and the delete carries the caller's scope.

const stamp = Date.now();
const PASSWORD = 'Password123!';

const tenant = {};
const ENDPOINT_B = `https://push.example.com/b/${stamp}`;

async function registerTenant(key) {
  const res = await request(app).post('/api/auth/register').send({
    name: `Owner ${key}`,
    email: `push${key}${stamp}@example.com`,
    password: PASSWORD,
    business_name: `push${key} Trading Co`,
  });
  expect(res.status, `register ${key}`).toBe(201);
  tenant[key] = { token: res.body?.token };
  const found = await query('SELECT id, business_id FROM users WHERE email = $1', [
    `push${key}${stamp}@example.com`,
  ]);
  tenant[key].userId = found.rows[0].id;
  tenant[key].businessId = found.rows[0].business_id;
  return tenant[key];
}

const asTenant = (key) => (req) => req.set('Authorization', `Bearer ${tenant[key].token}`);

const subscriptionFor = (endpoint) =>
  query('SELECT * FROM push_subscriptions WHERE endpoint = $1', [endpoint]);

beforeAll(async () => {
  await setupDB();
  await registerTenant('a');
  await registerTenant('b');

  // B holds the endpoint A will later try to name.
  await query(
    `INSERT INTO push_subscriptions (user_id, business_id, endpoint, p256dh_key, auth_key, device_name)
     VALUES ($1, $2, $3, 'b-p256dh', 'b-auth', 'B laptop')`,
    [tenant.b.userId, tenant.b.businessId, ENDPOINT_B]
  );
});

afterAll(async () => {
  for (const t of Object.values(tenant)) {
    try { await query('DELETE FROM push_subscriptions WHERE business_id = $1', [t.businessId]); } catch { /*ok*/ }
    try { await query('DELETE FROM users WHERE business_id = $1', [t.businessId]); } catch { /*ok*/ }
    try { await query('DELETE FROM businesses WHERE id = $1', [t.businessId]); } catch { /*ok*/ }
  }
});

describe('push subscriptions are scoped to the tenant that owns them', () => {
  it('another tenant cannot unsubscribe an endpoint it does not own', async () => {
    const res = await asTenant('a')(
      request(app).post('/api/push/unsubscribe').send({ endpoint: ENDPOINT_B })
    );
    expect(res.status).toBe(200);
    expect((await subscriptionFor(ENDPOINT_B)).rows).toHaveLength(1);
  });

  it('a cross-tenant unsubscribe does not disturb the stored keys', async () => {
    await asTenant('a')(request(app).post('/api/push/unsubscribe').send({ endpoint: ENDPOINT_B }));
    const row = (await subscriptionFor(ENDPOINT_B)).rows[0];
    expect(row.business_id).toBe(tenant.b.businessId);
    expect(row.p256dh_key).toBe('b-p256dh');
    expect(row.auth_key).toBe('b-auth');
  });

  it('the owner can still unsubscribe its own endpoint', async () => {
    const res = await asTenant('b')(
      request(app).post('/api/push/unsubscribe').send({ endpoint: ENDPOINT_B })
    );
    expect(res.status).toBe(200);
    expect(res.body.removed).toBe(1);
    expect((await subscriptionFor(ENDPOINT_B)).rows).toHaveLength(0);
  });

  it('subscribing an endpoint another tenant holds does not overwrite its keys', async () => {
    await query(
      `INSERT INTO push_subscriptions (user_id, business_id, endpoint, p256dh_key, auth_key, device_name)
       VALUES ($1, $2, $3, 'b-p256dh', 'b-auth', 'B laptop')`,
      [tenant.b.userId, tenant.b.businessId, ENDPOINT_B]
    );

    const res = await asTenant('a')(
      request(app).post('/api/push/subscribe').send({
        endpoint: ENDPOINT_B,
        keys: { p256dh: 'a-p256dh', auth: 'a-auth' },
        device_name: 'A laptop',
      })
    );
    expect(res.status).toBe(201);

    const rows = (await subscriptionFor(ENDPOINT_B)).rows;
    const bRow = rows.find((r) => r.business_id === tenant.b.businessId);
    expect(bRow, 'B still holds its own row').toBeTruthy();
    expect(bRow.p256dh_key).toBe('b-p256dh');
    expect(bRow.auth_key).toBe('b-auth');
    // A got a separate row rather than taking over B's, which is what the per
    // -business unique index is for.
    expect(rows.filter((r) => r.business_id === tenant.a.businessId)).toHaveLength(1);
  });

  it('removeSubscription refuses to run unscoped', async () => {
    await expect(removeSubscription(ENDPOINT_B)).rejects.toThrow(/requires a userId or businessId/);
  });
});

// The application-level scoping above is only half the fix. The other half is the
// schema: while `endpoint` carried a global UNIQUE, subscribing with an endpoint
// another business already held hit a constraint violation, and the old
// ON CONFLICT overwrote that row's keys. Migration 009 moves uniqueness onto the
// (business_id, endpoint) pair, and this asserts the database actually reflects
// that — the behavioural test above would still pass against a database where the
// migration had not been applied, because nothing writes a second row for B.
describe('push_subscriptions uniqueness is per business', () => {
  const uniqueIndexes = async () =>
    (await query(
      `SELECT indexdef FROM pg_indexes WHERE tablename = 'push_subscriptions' AND indexdef LIKE '%UNIQUE%'`
    )).rows.map((r) => r.indexdef);

  it('has no global unique index on endpoint alone', async () => {
    const global = (await uniqueIndexes()).filter(
      (def) => /\(endpoint\)\s*$/.test(def.trim())
    );
    expect(global).toEqual([]);
  });

  it('has a unique index on the (business_id, endpoint) pair', async () => {
    const composite = (await uniqueIndexes()).filter((def) =>
      /\(business_id,\s*endpoint\)/i.test(def)
    );
    expect(composite).toHaveLength(1);
  });
});