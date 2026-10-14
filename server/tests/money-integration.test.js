import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, setupDB } from './test-server.js';
import { query } from '../config/db.js';
import { calculateTotals } from '../utils/money.js';

// The unit tests in money.test.js pin the arithmetic. These prove the arithmetic
// is what actually reaches the database, because the defects being fixed lived in
// the gap between the two: saleService computed a correct-looking subtotal and
// tax, then stored them alongside a total that did not reconcile.

const stamp = Date.now();
const PASSWORD = 'Password123!';

const tenant = {};

const asA = (req) =>
  req.set('Authorization', `Bearer ${tenant.a.token}`);

async function insert(table, businessId, cols) {
  const keys = Object.keys(cols);
  const { rows } = await query(
    `INSERT INTO ${table} (business_id, ${keys.join(', ')}) VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING id`,
    [businessId, ...keys.map((k) => cols[k])]
  );
  return rows[0].id;
}

describe('stored money columns reconcile', () => {
  beforeAll(async () => {
    await setupDB();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Money Owner',
      email: `money${stamp}@example.com`,
      password: PASSWORD,
      business_name: `Money Trading Co ${stamp}`,
    });
    expect(res.status).toBe(201);
    tenant.a = {
      businessId: res.body.business.id,
      token: res.body.token,
      userId: res.body.user.id,
    };
  });

  afterAll(async () => {
    try { await query('DELETE FROM businesses WHERE id = $1', [tenant.a.businessId]); } catch { /*ok*/ }
  });

  // Recreated per test rather than once in beforeAll. tests/api.test.js tears the
  // whole products table down in its afterAll with a bare `DELETE FROM products`,
  // and vitest runs files in parallel, so a product created in beforeAll can be
  // gone by the time the next test posts a sale against it.
  async function createProduct(name, price) {
    return insert('products', tenant.a.businessId, {
      name, sku: `MONEY-${name}-${stamp}`, selling_price: price, cost_price: price, stock_qty: 500,
    });
  }

  it('stores a total equal to subtotal minus discount plus tax', async () => {
    const productId = await createProduct('Reconcile Item', 1000);

    const res = await asA(request(app).post('/api/sales')).send({
      customer_id: null,
      status: 'paid',
      discount_amount: 160,
      items: [{ product_id: productId, qty: 1, unit_price: 1000 }],
    });
    expect(res.status).toBe(201);

    const { rows } = await query(
      'SELECT subtotal, discount_amount, tax_amount, total FROM sales WHERE id = $1 AND business_id = $2',
      [res.body.id, tenant.a.businessId]
    );
    const sale = rows[0];

    expect(Number(sale.subtotal)).toBe(1000);
    expect(Number(sale.discount_amount)).toBe(160);
    expect(Number(sale.tax_amount)).toBe(134.4);
    expect(Number(sale.total)).toBe(974.4);
    // The identity the old code violated.
    expect(Number(sale.total)).toBeCloseTo(
      Number(sale.subtotal) - Number(sale.discount_amount) + Number(sale.tax_amount),
      2
    );
  });

  it('refuses a discount larger than the subtotal instead of storing a zero total', async () => {
    const productId = await createProduct('Overdiscount Item', 100);

    const res = await asA(request(app).post('/api/sales')).send({
      status: 'paid',
      discount_amount: 500,
      items: [{ product_id: productId, qty: 1, unit_price: 100 }],
    });

    expect(res.status).toBe(400);
    // Either body key: sendError writes `error`, but a handler forwarding to the
    // error middleware writes `message`. Asserting on the status alone would let a
    // 400 from an unrelated validation pass as the discount check.
    expect(res.body.error || res.body.message).toMatch(/exceeds the subtotal/i);

    // Nothing was written, and specifically not a zero-total sale. Scoped to this
    // tenant and to the product just created, so a concurrent suite cannot make
    // this pass or fail.
    const { rows } = await query(
      `SELECT count(*)::int AS n
         FROM sales
        WHERE business_id = $1
          AND total = 0
          AND subtotal > 0
          AND id IN (SELECT sale_id FROM sale_items WHERE product_id = $2)`,
      [tenant.a.businessId, productId]
    );
    expect(rows[0].n).toBe(0);
  });

  it('posts a cashflow entry equal to the sale total', async () => {
    const productId = await createProduct('Cashflow Item', 250);

    const res = await asA(request(app).post('/api/sales')).send({
      status: 'paid',
      discount_amount: 50,
      items: [{ product_id: productId, qty: 2, unit_price: 250 }],
    });
    expect(res.status).toBe(201);

    const { rows } = await query(
      "SELECT amount FROM cashflow_entries WHERE business_id = $1 AND source_type = 'sale' AND source_id = $2",
      [tenant.a.businessId, res.body.id]
    );
    expect(rows).toHaveLength(1);
    // 500 subtotal, 50 off, 450 taxable, 72 tax, 522 total.
    expect(Number(rows[0].amount)).toBe(522);
    expect(Number(rows[0].amount)).toBe(Number(res.body.total));
  });

  it('charges the rate configured on the business, not a constant', async () => {
    const productId = await createProduct('Exempt Item', 1000);

    await query('UPDATE businesses SET tax_rate = 0 WHERE id = $1', [tenant.a.businessId]);
    try {
      const res = await asA(request(app).post('/api/sales')).send({
        status: 'paid',
        items: [{ product_id: productId, qty: 1, unit_price: 1000 }],
      });
      expect(res.status).toBe(201);
      // A zero-rating is the reason the rate has to be per-business.
      expect(Number(res.body.tax_amount)).toBe(0);
      expect(Number(res.body.total)).toBe(1000);
    } finally {
      await query('UPDATE businesses SET tax_rate = 16 WHERE id = $1', [tenant.a.businessId]);
    }
  });

  it('stores what the receipt will print, so the rate label is honest', async () => {
    const productId = await createProduct('Receipt Rate Item', 500);

    const res = await asA(request(app).post('/api/sales')).send({
      status: 'paid',
      items: [{ product_id: productId, qty: 1, unit_price: 500 }],
    });
    expect(res.status).toBe(201);

    // The receipt previously printed a literal "Tax (16%)" regardless of what was
    // actually charged.
    const expected = calculateTotals({
      items: [{ qty: 1, unit_price: 500 }],
      orderDiscount: 0,
      taxRatePercent: 16,
    });
    expect(Number(res.body.tax_amount)).toBe(expected.taxAmount);
    expect(Number(res.body.total)).toBe(expected.total);
  });

  it('sums line totals to the stored subtotal across an awkward basket', async () => {
    const productId = await createProduct('Awkward Item', 65.55);

    const res = await asA(request(app).post('/api/sales')).send({
      status: 'paid',
      items: [
        { product_id: productId, qty: 3, unit_price: 20 },
        { product_id: productId, qty: 2, unit_price: 15 },
        { product_id: productId, qty: 1, unit_price: 65.55, discount: 5 },
      ],
    });
    expect(res.status).toBe(201);

    const { rows: itemRows } = await query(
      'SELECT qty, unit_price, discount, total FROM sale_items WHERE sale_id = $1 AND business_id = $2',
      [res.body.id, tenant.a.businessId]
    );
    // toBeCloseTo rather than toBe: summing three DECIMAL(12,2) values in JavaScript
    // reintroduces binary floating point, which is the thing the rounding exists to
    // prevent. The assertion is about drift, not about float representation.
    const lineSum = itemRows.reduce((s, i) => s + Number(i.total), 0);

    expect(Number(res.body.subtotal)).toBeCloseTo(lineSum, 2);
    expect(Number(res.body.total)).toBeCloseTo(
      Number(res.body.subtotal) + Number(res.body.tax_amount),
      2
    );
  });
});