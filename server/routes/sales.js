import express from 'express';
import { query, pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ========== MODULE 3: SALES / INVOICES ==========

router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT s.*, c.name as customer_name, c.email as customer_email 
               FROM sales s LEFT JOIN customers c ON s.customer_id = c.id 
               WHERE s.business_id = $1`;
    const params = [req.business_id];

    if (status) {
      sql += ' AND s.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY s.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const saleResult = await query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND s.business_id = $2`,
      [req.params.id, req.business_id]
    );

    if (saleResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const itemsResult = await query(
      'SELECT * FROM sale_items WHERE sale_id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );

    res.json({ ...saleResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, sale_date, due_date, items, notes, discount_amount = 0 } = req.body;

    // Generate invoice number
    const invResult = await client.query(
      "SELECT COUNT(*) as count FROM sales WHERE business_id = $1",
      [req.business_id]
    );
    const invoiceNumber = `INV-${String(parseInt(invResult.rows[0].count) + 1).padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of (items || [])) {
      subtotal += (item.qty * item.unit_price) - (item.discount || 0);
    }
    const total = subtotal - discount_amount;

    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales (business_id, customer_id, invoice_number, sale_date, due_date, subtotal, discount_amount, total, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.business_id, customer_id, invoiceNumber, sale_date || new Date(), due_date, subtotal, discount_amount, total, notes, req.user.id]
    );
    const sale = saleResult.rows[0];

    // Create sale items and update stock
    for (const item of (items || [])) {
      const itemTotal = (item.qty * item.unit_price) - (item.discount || 0);

      await client.query(
        `INSERT INTO sale_items (business_id, sale_id, product_id, product_name, qty, unit_price, discount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [req.business_id, sale.id, item.product_id, item.product_name, item.qty, item.unit_price, item.discount || 0, itemTotal]
      );

      // Update stock if product_id provided
      if (item.product_id) {
        const productResult = await client.query('SELECT stock_qty FROM products WHERE id = $1', [item.product_id]);
        const oldQty = productResult.rows[0]?.stock_qty || 0;
        const newQty = oldQty - item.qty;

        await client.query(
          'UPDATE products SET stock_qty = $1, updated_at = NOW() WHERE id = $2',
          [newQty, item.product_id]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (business_id, product_id, qty_before, qty_change, qty_after, reason, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, 'sale', 'sale', $6)`,
          [req.business_id, item.product_id, oldQty, -item.qty, newQty, sale.id]
        );
      }
    }

    // Record cashflow entry
    if (total > 0) {
      await client.query(
        `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
         VALUES ($1, 'inflow', $2, $3, $4, 'sale', $5)`,
        [req.business_id, total, sale_date || new Date(), `Invoice ${invoiceNumber}`, sale.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(sale);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, notes } = req.body;

    let paidDate = null;
    if (status === 'paid') {
      paidDate = new Date();
    }

    const result = await query(
      `UPDATE sales SET status = COALESCE($1, status), notes = COALESCE($2, notes), amount_paid = CASE WHEN $1 = 'paid' THEN total ELSE amount_paid END,
       updated_at = NOW() WHERE id = $3 AND business_id = $4 RETURNING *`,
      [status, notes, req.params.id, req.business_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get items to restore stock
    const items = await client.query('SELECT product_id, qty FROM sale_items WHERE sale_id = $1 AND business_id = $2', [req.params.id, req.business_id]);

    for (const item of items.rows) {
      if (item.product_id) {
        await client.query(
          'UPDATE products SET stock_qty = stock_qty + $1, updated_at = NOW() WHERE id = $2',
          [item.qty, item.product_id]
        );
      }
    }

    await client.query('DELETE FROM sale_items WHERE sale_id = $1 AND business_id = $2', [req.params.id, req.business_id]);
    await client.query('DELETE FROM sales WHERE id = $1 AND business_id = $2', [req.params.id, req.business_id]);

    await client.query('COMMIT');
    res.json({ message: 'Deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;