import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, setupDB } from './test-server.js';
import { query } from '../config/db.js';

// Tenant isolation is the one property a hosted multi-tenant product cannot get
// wrong, so it is asserted rather than reviewed. Two businesses are created and
// every id belonging to B is probed with A's token.
//
// The expected status is 404, not 403. A 403 would confirm the row exists, which
// is an enumeration oracle: an attacker could walk the id space and learn how
// many customers a competitor has. `assertOwned` already returns 404 for exactly
// that reason (see server/utils/tenantGuard.js) and these tests hold the routes
// to it.

const stamp = Date.now();
const PASSWORD = 'Password123!';

const tenant = {};
const ids = {};

async function registerTenant(key) {
  const res = await request(app).post('/api/auth/register').send({
    name: `Owner ${key}`,
    email: `${key}${stamp}@example.com`,
    password: PASSWORD,
    business_name: `${key} Trading Co`,
  });
  expect(res.status, `register ${key}`).toBe(201);
  tenant[key] = {
    token: res.body?.token,
    businessId: res.body?.user?.business_id,
    userId: res.body?.user?.id,
  };
  if (!tenant[key].businessId) {
    const found = await query('SELECT id, business_id FROM users WHERE email = $1', [`${key}${stamp}@example.com`]);
    tenant[key].userId = found.rows[0]?.id;
    tenant[key].businessId = found.rows[0]?.business_id;
  }
  return tenant[key];
}

/** Inserts a row owned by `businessId` and returns its id. */
async function insert(table, businessId, values) {
  const keys = Object.keys(values);
  // $1 is business_id, so the value columns start at $2.
  const placeholders = keys.map((_, i) => `$${i + 2}`);
  const res = await query(
    `INSERT INTO ${table} (business_id, ${keys.join(', ')}) VALUES ($1, ${placeholders.join(', ')}) RETURNING id`,
    [businessId, ...keys.map(k => values[k])]
  );
  return res.rows[0].id;
}

const asA = (req) => req.set('Authorization', `Bearer ${tenant.a.token}`);
const rowById = (table, id) => query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
const countBy = (table, column, value) =>
  query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE ${column} = $1`, [value]);
// List endpoints are inconsistent: customers answer `{ success, data }`, products a
// bare array. Accept either so the assertions test isolation, not envelope shape.
const rowsOf = (body) => (Array.isArray(body) ? body : body?.data || []);

beforeAll(async () => {
  await setupDB();
  await registerTenant('a');
  await registerTenant('b');

  // Records owned by B, which must stay invisible to A.
  ids.bCustomer = await insert('customers', tenant.b.businessId, {
    name: 'B Customer Secret', email: 'b-secret@example.com', phone: '+254700000001',
  });
  ids.bProduct = await insert('products', tenant.b.businessId, {
    name: 'B Product Secret', sku: `B-SKU-${stamp}`, barcode: `B-BC-${stamp}`,
    selling_price: 100, cost_price: 50, stock_qty: 10,
  });
  ids.bInvoice = await insert('invoices', tenant.b.businessId, {
    customer_id: ids.bCustomer, invoice_number: `B-INV-${stamp}`, total: 500,
  });
  ids.bSale = await insert('sales', tenant.b.businessId, {
    customer_id: ids.bCustomer, invoice_number: `B-SAL-${stamp}`, total: 500, status: 'pending',
  });

  // A's own records, so a list endpoint has something of its own to return and a
  // leak cannot be mistaken for an empty result.
  ids.aCustomer = await insert('customers', tenant.a.businessId, {
    name: 'A Customer', email: 'a@example.com',
  });
  ids.aProduct = await insert('products', tenant.a.businessId, {
    name: 'A Product', sku: `A-SKU-${stamp}`, selling_price: 100, cost_price: 50, stock_qty: 10,
  });
});

afterAll(async () => {
  for (const t of Object.values(tenant)) {
    for (const table of ['sale_items', 'sales', 'invoices', 'products', 'customers']) {
      try { await query(`DELETE FROM ${table} WHERE business_id = $1`, [t.businessId]); } catch { /*ok*/ }
    }
    try { await query('DELETE FROM users WHERE business_id = $1', [t.businessId]); } catch { /*ok*/ }
    try { await query('DELETE FROM businesses WHERE id = $1', [t.businessId]); } catch { /*ok*/ }
  }
});

describe('cross-tenant reads return 404, not 403', () => {
  it('hides another tenant customer', async () => {
    const res = await asA(request(app).get(`/api/customers/${ids.bCustomer}`));
    expect(res.status).toBe(404);
  });

  it('hides another tenant product', async () => {
    const res = await asA(request(app).get(`/api/products/${ids.bProduct}`));
    expect(res.status).toBe(404);
  });

  it('hides another tenant invoice', async () => {
    const res = await asA(request(app).get(`/api/invoices/${ids.bInvoice}`));
    expect(res.status).toBe(404);
  });

  it('hides another tenant sale', async () => {
    const res = await asA(request(app).get(`/api/sales/${ids.bSale}`));
    expect(res.status).toBe(404);
  });

  it('does not confirm existence through a 403', async () => {
    const res = await asA(request(app).get(`/api/customers/${ids.bCustomer}`));
    expect(res.status).not.toBe(403);
  });

  it('omits another tenant customer from the list', async () => {
    const res = await asA(request(app).get('/api/customers'));
    expect(res.status).toBe(200);
    const names = rowsOf(res.body).map(c => c.name);
    expect(names).toContain('A Customer');
    expect(names).not.toContain('B Customer Secret');
  });

  it('omits another tenant product from the list', async () => {
    const res = await asA(request(app).get('/api/products'));
    expect(res.status).toBe(200);
    const names = rowsOf(res.body).map(p => p.name);
    expect(names).toContain('A Product');
    expect(names).not.toContain('B Product Secret');
  });
});

describe('cross-tenant writes are refused and change nothing', () => {
  it('PUT on another tenant customer returns 404 and leaves the row intact', async () => {
    const before = (await rowById('customers', ids.bCustomer)).rows[0];
    const res = await asA(request(app).put(`/api/customers/${ids.bCustomer}`)).send({ name: 'Hijacked' });
    expect(res.status).toBe(404);
    const after = (await rowById('customers', ids.bCustomer)).rows[0];
    expect(after.name).toBe(before.name);
    expect(after.name).toBe('B Customer Secret');
  });

  it('DELETE on another tenant customer returns 404 and keeps the row', async () => {
    const res = await asA(request(app).delete(`/api/customers/${ids.bCustomer}`));
    expect(res.status).toBe(404);
    expect((await rowById('customers', ids.bCustomer)).rows).toHaveLength(1);
  });

  it('DELETE on another tenant product returns 404 and keeps the row', async () => {
    const res = await asA(request(app).delete(`/api/products/${ids.bProduct}`));
    expect(res.status).toBe(404);
    expect((await rowById('products', ids.bProduct)).rows).toHaveLength(1);
  });

  it('PUT on another tenant sale returns 404 and leaves the status alone', async () => {
    const res = await asA(request(app).put(`/api/sales/${ids.bSale}`)).send({ status: 'paid' });
    expect(res.status).toBe(404);
    expect((await rowById('sales', ids.bSale)).rows[0].status).toBe('pending');
  });

  it('DELETE on another tenant sale returns 404 and keeps the row', async () => {
    const res = await asA(request(app).delete(`/api/sales/${ids.bSale}`));
    expect(res.status).toBe(404);
    expect((await rowById('sales', ids.bSale)).rows).toHaveLength(1);
  });

  it('ignores a business_id supplied in the request body', async () => {
    const res = await asA(request(app).post('/api/customers')).send({
      name: 'Smuggled', business_id: tenant.b.businessId,
    });
    expect(res.status).toBe(201);
    const created = res.body?.data;
    expect(created.business_id).toBe(tenant.a.businessId);
    try { await query('DELETE FROM customers WHERE id = $1', [created.id]); } catch { /*ok*/ }
  });
});

// The import path takes foreign keys as ordinary columns. A row written by A can
// therefore point at B's customer, and any query joining on that id without
// restating the tenant hands B's details back to A. This is the dangling-FK
// scenario described at the top of server/utils/tenantGuard.js.
describe('cross-tenant foreign keys written through import', () => {
  it('refuses to attach another tenant customer to an invoice', async () => {
    const res = await asA(request(app).post('/api/import/invoices')).send({
      data: [{ customer_id: ids.bCustomer, invoice_number: `A-IMPORTS-B-${stamp}`, total: 250 }],
    });
    expect(res.status).toBe(200);
    expect(res.body.failed).toBe(1);
    expect(res.body.success).toBe(0);
    expect((await countBy('invoices', 'invoice_number', `A-IMPORTS-B-${stamp}`)).rows[0].n).toBe(0);
  });

  it('refuses to attach another tenant user as a ticket assignee', async () => {
    const res = await asA(request(app).post('/api/import/tickets')).send({
      data: [{ ticket_number: `A-TKT-${stamp}`, subject: 'Smuggled ticket', assigned_to: tenant.b.userId }],
    });
    expect(res.status).toBe(200);
    expect(res.body.failed).toBe(1);
    expect((await countBy('support_tickets', 'ticket_number', `A-TKT-${stamp}`)).rows[0].n).toBe(0);
  });

  it('still imports a ticket assigned to the caller own staff', async () => {
    const res = await asA(request(app).post('/api/import/tickets')).send({
      data: [{ ticket_number: `A-TKT-OK-${stamp}`, subject: 'Legit ticket', assigned_to: tenant.a.userId }],
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(1);
    try { await query('DELETE FROM support_tickets WHERE ticket_number = $1', [`A-TKT-OK-${stamp}`]); } catch { /*ok*/ }
  });

  it('still imports a row whose references are the caller own', async () => {
    const res = await asA(request(app).post('/api/import/invoices')).send({
      data: [{ customer_id: ids.aCustomer, invoice_number: `A-IMPORT-OK-${stamp}`, total: 250 }],
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(1);
    const created = await query('SELECT business_id FROM invoices WHERE invoice_number = $1', [`A-IMPORT-OK-${stamp}`]);
    expect(created.rows[0].business_id).toBe(tenant.a.businessId);
    try { await query('DELETE FROM invoices WHERE invoice_number = $1', [`A-IMPORT-OK-${stamp}`]); } catch { /*ok*/ }
  });

  it('reports one bad row without discarding the rest of the file', async () => {
    const res = await asA(request(app).post('/api/import/invoices')).send({
      data: [
        { customer_id: ids.bCustomer, invoice_number: `A-BAD-${stamp}`, total: 100 },
        { customer_id: ids.aCustomer, invoice_number: `A-GOOD-${stamp}`, total: 100 },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.failed).toBe(1);
    expect(res.body.success).toBe(1);
    try { await query('DELETE FROM invoices WHERE invoice_number = $1', [`A-GOOD-${stamp}`]); } catch { /*ok*/ }
  });
});

// Even with the import hole closed, a dangling reference can exist from a historic
// write, a bad migration, or a future path that forgets the check. These assert
// the read side defends itself, so isolation does not rest on there being exactly
// one way to create a row.
describe('joins do not leak across a tenant boundary', () => {
  beforeAll(async () => {
    // A sale owned by A whose customer_id points into B's tenant. Written
    // directly to reproduce the pre-fix state, bypassing the API on purpose.
    ids.aDanglingSale = await insert('sales', tenant.a.businessId, {
      customer_id: ids.bCustomer, invoice_number: `A-DANGLING-${stamp}`, total: 999, status: 'pending',
    });
  });

  afterAll(async () => {
    try { await query('DELETE FROM sales WHERE id = $1', [ids.aDanglingSale]); } catch { /*ok*/ }
  });

  it('keeps the other tenant customer name out of the sales report', async () => {
    const res = await asA(request(app).get('/api/reports/sales-report'));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('B Customer Secret');
  });

  it('keeps the other tenant customer email out of notifications', async () => {
    const res = await asA(request(app).get('/api/notifications'));
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('b-secret@example.com');
    expect(body).not.toContain('B Customer Secret');
  });

  it('keeps the other tenant customer name off the dashboard', async () => {
    const res = await asA(request(app).get('/api/dashboard'));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('B Customer Secret');
  });

  it('cannot address a payment reminder to another tenant customer', async () => {
    const res = await asA(request(app).post(`/api/notifications/send-reminder/${ids.aDanglingSale}`));
    // The sale is A's, so the route does find it; what it must not do is resolve
    // B's email address. A 2xx would mean the reminder went to B's customer.
    expect([400, 404]).toContain(res.status);
  });
});