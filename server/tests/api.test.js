import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import { app, setupDB } from './test-server.js';
import { query } from '../config/db.js';

const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Password123!',
  business_name: 'Test Business',
};

let authToken = '';

beforeAll(async () => {
  await setupDB();
  try { await query('DELETE FROM login_attempts'); } catch { /*ok*/ }
  try { await query('DELETE FROM audit_logs'); } catch { /*ok*/ }
  try { await query('DELETE FROM cashflow_entries'); } catch { /*ok*/ }
  try { await query('DELETE FROM stock_movements'); } catch { /*ok*/ }
  try { await query('DELETE FROM po_items'); } catch { /*ok*/ }
  try { await query('DELETE FROM purchase_orders'); } catch { /*ok*/ }
  try { await query('DELETE FROM payroll_items'); } catch { /*ok*/ }
  try { await query('DELETE FROM payroll'); } catch { /*ok*/ }
  try { await query('DELETE FROM attendance'); } catch { /*ok*/ }
  try { await query('DELETE FROM employees'); } catch { /*ok*/ }
  try { await query('DELETE FROM time_entries'); } catch { /*ok*/ }
  try { await query('DELETE FROM project_tasks'); } catch { /*ok*/ }
  try { await query('DELETE FROM projects'); } catch { /*ok*/ }
  try { await query('DELETE FROM deal_activities'); } catch { /*ok*/ }
  try { await query('DELETE FROM deals'); } catch { /*ok*/ }
  try { await query('DELETE FROM deal_stages'); } catch { /*ok*/ }
  try { await query('DELETE FROM customer_activities'); } catch { /*ok*/ }
  try { await query('DELETE FROM leads'); } catch { /*ok*/ }
  try { await query('DELETE FROM ticket_replies'); } catch { /*ok*/ }
  try { await query('DELETE FROM support_tickets'); } catch { /*ok*/ }
  try { await query('DELETE FROM sla_configs'); } catch { /*ok*/ }
  try { await query('DELETE FROM vendor_products'); } catch { /*ok*/ }
  try { await query('DELETE FROM vendors'); } catch { /*ok*/ }
  try { await query('DELETE FROM receipts'); } catch { /*ok*/ }
  try { await query('DELETE FROM invoice_items'); } catch { /*ok*/ }
  try { await query('DELETE FROM invoices'); } catch { /*ok*/ }
  try { await query('DELETE FROM sale_items'); } catch { /*ok*/ }
  try { await query('DELETE FROM sales'); } catch { /*ok*/ }
  try { await query('DELETE FROM products'); } catch { /*ok*/ }
  try { await query('DELETE FROM categories'); } catch { /*ok*/ }
  try { await query('DELETE FROM expenses'); } catch { /*ok*/ }
  try { await query('DELETE FROM expense_categories'); } catch { /*ok*/ }
  try { await query('DELETE FROM customers'); } catch { /*ok*/ }
  try { await query('DELETE FROM payment_history'); } catch { /*ok*/ }
  try { await query('DELETE FROM invoice_templates'); } catch { /*ok*/ }
  try { await query('DELETE FROM ai_insights'); } catch { /*ok*/ }
  try { await query('DELETE FROM report_schedules'); } catch { /*ok*/ }
  try { await query('DELETE FROM debtor_payments'); } catch { /*ok*/ }
  try { await query('DELETE FROM debtor_invoices'); } catch { /*ok*/ }
  try { await query('DELETE FROM debtors'); } catch { /*ok*/ }
  try { await query('DELETE FROM creditor_payments'); } catch { /*ok*/ }
  try { await query('DELETE FROM creditor_purchases'); } catch { /*ok*/ }
  try { await query('DELETE FROM creditors'); } catch { /*ok*/ }
  try { await query('DELETE FROM refresh_tokens'); } catch { /*ok*/ }
  try { await query('DELETE FROM password_resets'); } catch { /*ok*/ }
  try { await query('DELETE FROM users WHERE email LIKE \'test%@example.com\''); } catch { /*ok*/ }
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    authToken = res.body.token;
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid registration details');
  });

  it('should reject invalid login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    
    expect(res.status).toBe(401);
  });
});

describe('Customers API', () => {
  const testCustomer = {
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '+254712345678',
    company: 'Test Company',
  };

  let customerId = '';

  it('should create a customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testCustomer);
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', testCustomer.name);
    customerId = res.body.data.id;
  });

  it('should get all customers', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should update a customer', async () => {
    const res = await request(app)
      .put(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('should delete a customer', async () => {
    const res = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Products API', () => {
  const testProduct = {
    name: 'Test Product',
    selling_price: 1000,
    cost_price: 500,
    stock_qty: 50,
  };

  it('should create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testProduct);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', testProduct.name);
  });

  it('should get all products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
  });

  it('should get low stock products', async () => {
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...testProduct, name: 'Low Stock', stock_qty: 2, reorder_level: 10 });
    
    const res = await request(app)
      .get('/api/products?low_stock=true')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
  });
});

describe('Invoices API', () => {
  it('should create an invoice with items', async () => {
    const customerRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Invoice Customer' });
    
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customer_id: customerRes.body.id,
        due_date: '2026-05-01',
        items: [
          { product_name: 'Service 1', qty: 2, unit_price: 1000 },
          { product_name: 'Service 2', qty: 1, unit_price: 500 },
        ],
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('invoice_number');
  });

  it('should get all invoices', async () => {
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
  });

  it('should update invoice status', async () => {
    const invoiceRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ items: [{ product_name: 'Test', qty: 1, unit_price: 100 }] });
    
    const res = await request(app)
      .put(`/api/invoices/${invoiceRes.body.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'paid' });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
  });
});

describe('Expenses API', () => {
  it('should create an expense', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: 'Office Supplies',
        amount: 5000,
      });
    
    expect(res.status).toBe(201);
    expect(Number(res.body.amount)).toBe(5000);
  });

  it('should get expenses by category', async () => {
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'Test', amount: 100 });
    
    const res = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
  });

  it('should reject invalid expenses and keep the connection usable', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 100 });

    expect(res.status).toBe(400);

    const followUp = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(followUp.status).toBe(200);
  });

  it('should remove the linked cashflow entry when an expense is deleted', async () => {
    const created = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'Deletable', amount: 750 });

    expect(created.status).toBe(201);

    const before = await query(
      `SELECT COUNT(*)::int as count FROM cashflow_entries WHERE source_id = $1 AND source_type = 'expense'`,
      [created.body.id]
    );
    expect(before.rows[0].count).toBe(1);

    const removed = await request(app)
      .delete(`/api/expenses/${created.body.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(removed.status).toBe(200);

    const after = await query(
      `SELECT COUNT(*)::int as count FROM cashflow_entries WHERE source_id = $1 AND source_type = 'expense'`,
      [created.body.id]
    );
    expect(after.rows[0].count).toBe(0);
  });
});

describe('Procurement API', () => {
  let vendorId = '';

  it('should create a purchase order with its items atomically', async () => {
    const vendor = await request(app)
      .post('/api/procurement/vendors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Vendor' });
    expect(vendor.status).toBe(201);
    vendorId = vendor.body.id;

    const res = await request(app)
      .post('/api/procurement/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vendor_id: vendorId,
        items: [{ product_name: 'Widget', qty: 2, unit_price: 1000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.po_number).toBe('PO-00001');
    expect(res.body.items).toHaveLength(1);
    expect(Number(res.body.total)).toBe(2320);
  });

  it('should increment purchase order numbers per business', async () => {
    const res = await request(app)
      .post('/api/procurement/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ vendor_id: vendorId, items: [] });

    expect(res.status).toBe(201);
    expect(res.body.po_number).toBe('PO-00002');
  });

  it('should reject purchase orders without an items array', async () => {
    const res = await request(app)
      .post('/api/procurement/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ vendor_id: vendorId });

    expect(res.status).toBe(400);
  });

  it('should delete a purchase order with its items', async () => {
    const created = await request(app)
      .post('/api/procurement/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ vendor_id: vendorId, items: [{ product_name: 'Widget', qty: 1, unit_price: 500 }] });
    expect(created.status).toBe(201);

    const removed = await request(app)
      .delete(`/api/procurement/purchase-orders/${created.body.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(removed.status).toBe(200);

    const items = await query('SELECT id FROM po_items WHERE po_id = $1', [created.body.id]);
    expect(items.rows).toHaveLength(0);
  });
});

describe('API Key API', () => {
  it('should authenticate a generated key that is hashed without its prefix', async () => {
    const created = await request(app)
      .post('/api/api-keys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Integration key', scopes: ['*'] });

    expect(created.status).toBe(201);
    const rawKey = created.body.data.key;
    expect(rawKey).toMatch(/^bf_[0-9a-f]{64}$/);

    const res = await request(app)
      .get('/api/procurement/vendors')
      .set('x-api-key', rawKey);

    expect(res.status).toBe(200);
  });

  it('should still accept keys hashed with their full value', async () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const key = `bf_${raw}`;
    const storedHash = crypto.createHash('sha256').update(key).digest('hex');

    const user = await query('SELECT id, business_id FROM users WHERE email = $1', [testUser.email]);
    await query(
      `INSERT INTO api_keys (business_id, name, key_hash, key_prefix, scopes, created_by)
       VALUES ($1, 'Legacy key', $2, $3, '["*"]', $4)`,
      [user.rows[0].business_id, storedHash, `bf_${raw.substring(0, 8)}`, user.rows[0].id]
    );

    const res = await request(app)
      .get('/api/procurement/vendors')
      .set('x-api-key', key);

    expect(res.status).toBe(200);
  });

  it('should reject unknown keys', async () => {
    const res = await request(app)
      .get('/api/procurement/vendors')
      .set('x-api-key', `bf_${crypto.randomBytes(32).toString('hex')}`);

    expect(res.status).toBe(401);
  });
});

describe('Dashboard API', () => {
  it('should get dashboard stats', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('totalCustomers');
    expect(res.body.stats).toHaveProperty('totalRevenue');
  });

  it('should get profit summary', async () => {
    const res = await request(app)
      .get('/api/dashboard/profit-summary')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('revenue');
    expect(res.body).toHaveProperty('expenses');
    expect(res.body).toHaveProperty('profit');
  });
});

describe('Health API', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('Protected Routes', () => {
  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .get('/api/customers');
    
    expect(res.status).toBe(401);
  });

  it('should reject invalid tokens', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(res.status).toBe(401);
  });
});