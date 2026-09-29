import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, query } from '../config/db.js';
import { generateApiKey } from '../middleware/apiKey.js';
import { generateToken } from '../middleware/auth.js';

/**
 * API keys are documented as an `X-API-Key` header "in place of a JWT"
 * (docs/architecture.md). These tests drive app.js rather than
 * tests/test-server.js, because test-server.js wires its own
 * authenticateApiKeyOrJwt combinator and so never exercised the real stack.
 *
 * Keys are inserted directly rather than through POST /api/api-keys so the
 * scope column holds exactly the value under test, including the malformed
 * shapes the create route is expected to reject.
 */
const stamp = Date.now();
const PASSWORD = 'Password123!';

let businessId;
let otherBusinessId;
let ownerId;
let managerId;
let ownerToken;

/** Mints a key owned by `userId` with a literal `scopes` column value. */
const mintKey = async (userId, scopes) => {
  const { raw, hash, prefix } = generateApiKey();
  await query(
    `INSERT INTO api_keys (business_id, name, key_hash, key_prefix, scopes, created_by)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [businessId, `key-${stamp}-${userId}-${JSON.stringify(scopes)}`, hash, prefix, JSON.stringify(scopes), userId],
  );
  return { key: raw, hash };
};

// A session-authenticated POST still goes through validateCsrf, unlike a key
// call. The cookie and the header have to agree, so they are paired here.
const csrfToken = 'a'.repeat(64);
const withCsrf = (req) => req
  .set('Cookie', `csrf_token=${csrfToken}; csrf_expiry=${Date.now() + 3_600_000}`)
  .set('X-Csrf-Token', csrfToken);

const withKey = (key, req) => req.set('X-API-Key', key);

const createCustomer = (label) => ({ name: label, email: `${label}${stamp}@example.com` });

beforeAll(async () => {
  await initDatabase(3, 500);

  const reg = await request(app).post('/api/auth/register').send({
    name: 'Key Owner',
    email: `keyowner${stamp}@example.com`,
    password: PASSWORD,
    business_name: 'Key Business',
  });
  expect(reg.status).toBe(201);
  businessId = reg.body.business?.id;
  expect(businessId).toBeTruthy();

  // The role has to come from the row: generateToken signs it into the JWT, and
  // requirePermission reads it from there rather than re-reading the user.
  const owner = await query(
    `SELECT id, name, email, role FROM users WHERE business_id = $1 AND role = 'owner'`,
    [businessId],
  );
  ownerId = owner.rows[0].id;
  ownerToken = generateToken({ ...owner.rows[0], business_id: businessId });

  // A non-owner member, so a key can be shown never to exceed its creator.
  const manager = await query(
    `INSERT INTO users (business_id, name, email, password, role, is_active, email_verified)
     VALUES ($1, 'Key Manager', $2, 'unused', 'manager', TRUE, TRUE) RETURNING id`,
    [businessId, `keymanager${stamp}@example.com`],
  );
  managerId = manager.rows[0].id;

  const other = await request(app).post('/api/auth/register').send({
    name: 'Other Owner',
    email: `otherowner${stamp}@example.com`,
    password: PASSWORD,
    business_name: 'Other Business',
  });
  expect(other.status).toBe(201);
  otherBusinessId = other.body.business?.id;
});

afterAll(async () => {
  for (const id of [businessId, otherBusinessId]) {
    if (!id) continue;
    try { await query('DELETE FROM api_keys WHERE business_id = $1', [id]); } catch { /*ok*/ }
    try { await query('DELETE FROM permissions WHERE business_id = $1', [id]); } catch { /*ok*/ }
    try { await query('DELETE FROM users WHERE business_id = $1', [id]); } catch { /*ok*/ }
    try { await query('DELETE FROM businesses WHERE id = $1', [id]); } catch { /*ok*/ }
  }
});

describe('API key authentication', () => {
  it('authenticates a business request with only the key header', async () => {
    const res = await withKey((await mintKey(ownerId, ['read'])).key, request(app).get('/api/customers'));
    expect(res.status).toBe(200);
  });

  it('rejects a key that does not exist', async () => {
    const res = await withKey('bf_deadbeefdeadbeef', request(app).get('/api/customers'));
    expect(res.status).toBe(401);
  });

  it('needs no CSRF token, because the key is a header credential', async () => {
    const res = await withKey((await mintKey(ownerId, ['*'])).key, request(app).post('/api/customers'))
      .send(createCustomer('key-no-csrf'));
    expect(res.status).toBe(201);
  });

  it('is scoped to its own business and never returns another business rows', async () => {
    await query(
      `INSERT INTO customers (business_id, name, email) VALUES ($1, 'Foreign Row', $2)`,
      [otherBusinessId, `foreign${stamp}@example.com`],
    );
    const res = await withKey((await mintKey(ownerId, ['read'])).key, request(app).get('/api/customers'));
    expect(res.status).toBe(200);
    const rows = res.body.data ?? [];
    expect(rows.some((row) => row.name === 'Foreign Row')).toBe(false);
  });

  it('rejects a revoked key', async () => {
    const { key, hash } = await mintKey(ownerId, ['*']);
    await query('UPDATE api_keys SET is_active = false WHERE key_hash = $1', [hash]);
    const res = await withKey(key, request(app).get('/api/customers'));
    expect(res.status).toBe(401);
  });

  it('rejects an expired key', async () => {
    const { key, hash } = await mintKey(ownerId, ['*']);
    await query(`UPDATE api_keys SET expires_at = NOW() - INTERVAL '1 day' WHERE key_hash = $1`, [hash]);
    const res = await withKey(key, request(app).get('/api/customers'));
    expect(res.status).toBe(401);
  });
});

describe('API key scopes', () => {
  it('lets a read scope read but not write', async () => {
    const { key } = await mintKey(ownerId, ['read']);
    expect((await withKey(key, request(app).get('/api/customers'))).status).toBe(200);
    const write = await withKey(key, request(app).post('/api/customers'))
      .send(createCustomer('key-read-only'));
    expect(write.status).toBe(403);
  });

  it('lets a write scope create', async () => {
    const res = await withKey((await mintKey(ownerId, ['write'])).key, request(app).post('/api/customers'))
      .send(createCustomer('key-write-scope'));
    expect(res.status).toBe(201);
  });

  it('fails closed when scopes is a bare string rather than a list', async () => {
    const res = await withKey((await mintKey(ownerId, 'read')).key, request(app).get('/api/customers'));
    expect(res.status).toBe(403);
  });

  it('fails closed on an empty scope list', async () => {
    const res = await withKey((await mintKey(ownerId, [])).key, request(app).get('/api/customers'));
    expect(res.status).toBe(403);
  });
});

describe('API key authority is bounded by its creator', () => {
  it('stops a manager key from reaching owner-only surfaces', async () => {
    const res = await withKey((await mintKey(managerId, ['*'])).key, request(app).get('/api/api-keys'));
    expect(res.status).toBe(403);
  });

  it('lets a manager key read what its manager can read', async () => {
    const res = await withKey((await mintKey(managerId, ['read'])).key, request(app).get('/api/customers'));
    expect(res.status).toBe(200);
  });
});

describe('minting a key', () => {
  const create = (body) => withCsrf(request(app).post('/api/api-keys'))
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(body);

  it('defaults to a read-only key when no scopes are given', async () => {
    const res = await create({ name: `default-scope-${stamp}` });
    expect(res.status).toBe(201);
    expect(res.body.data.scopes).toEqual(['read']);
  });

  it('keeps a well-formed scope list', async () => {
    const res = await create({ name: `read-write-${stamp}`, scopes: ['read', 'write'] });
    expect(res.status).toBe(201);
    expect(res.body.data.scopes).toEqual(['read', 'write']);
  });

  it('rejects a bare string, which would otherwise mint a key that always 403s', async () => {
    const res = await create({ name: `bad-string-${stamp}`, scopes: 'read' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must be an array/);
  });

  it('rejects an empty scope list rather than minting a dead key', async () => {
    const res = await create({ name: `empty-${stamp}`, scopes: [] });
    expect(res.status).toBe(400);
  });

  it('rejects a scope it does not recognise', async () => {
    const res = await create({ name: `typo-${stamp}`, scopes: ['reed'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unknown scope/);
  });
});

describe('JWT authentication is unaffected', () => {
  it('still rejects a request with neither credential', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });

  it('still rejects an invalid key even when a valid JWT rides along', async () => {
    // An explicitly supplied bad credential is not silently dropped in favour of
    // the session token; authenticateApiKey answers before the JWT is read.
    const res = await withKey('bf_notarealkey', request(app).get('/api/customers'))
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(401);
  });
});
