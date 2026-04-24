import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './test-server.js';

const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  business_name: 'Test Business',
};

let authToken = '';

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
    expect(res.body.error).toContain('already registered');
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

  it('should create a customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testCustomer);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', testCustomer.name);
  });

  it('should get all customers', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should update a customer', async () => {
    const createRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...testCustomer, name: 'Original Name' });
    
    const res = await request(app)
      .put(`/api/customers/${createRes.body.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' });
    
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('should delete a customer', async () => {
    const createRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testCustomer);
    
    const res = await request(app)
      .delete(`/api/customers/${createRes.body.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
  });
});

describe('Products API', () => {
  const testProduct = {
    name: 'Test Product',
    price: 1000,
    cost: 500,
    quantity: 50,
    category: 'Electronics',
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
      .send({ ...testProduct, name: 'Low Stock', quantity: 2, low_stock_threshold: 10 });
    
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
          { description: 'Service 1', quantity: 2, unit_price: 1000 },
          { description: 'Service 2', quantity: 1, unit_price: 500 },
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
      .send({ items: [{ description: 'Test', quantity: 1, unit_price: 100 }] });
    
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
        category: 'Supplies',
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('amount', '5000.00');
  });

  it('should get expenses by category', async () => {
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'Test', amount: 100, category: 'Marketing' });
    
    const res = await request(app)
      .get('/api/expenses?category=Marketing')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
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