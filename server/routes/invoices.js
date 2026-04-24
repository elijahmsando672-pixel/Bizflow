import express from 'express';
import { query, pool } from '../config/db.js';
import { authenticate } from './auth.js';
import { sendInvoiceEmail, sendPaymentReminderEmail } from '../utils/email.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.business_id = $1`;
    const params = [req.business_id];
    
    if (status) {
      sql += ' AND i.status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY i.created_at DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoiceResult = await query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       WHERE i.id = $1 AND i.business_id = $2`,
      [req.params.id, req.business_id]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const itemsResult = await query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    
    res.json({
      ...invoiceResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, invoice_date, due_date, items, notes, discount_amount = 0 } = req.body;

    // Generate invoice number
    const countResult = await client.query(
      "SELECT COUNT(*) as count FROM invoices WHERE business_id = $1",
      [req.business_id]
    );
    const invoiceNumber = `INV-${String(parseInt(countResult.rows[0].count) + 1).padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of (items || [])) {
      subtotal += (item.qty * item.unit_price) - (item.discount || 0);
    }
    const total = subtotal - discount_amount;

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (business_id, customer_id, invoice_number, invoice_date, due_date, subtotal, discount_amount, total, notes, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft') RETURNING *`,
      [req.business_id, customer_id, invoiceNumber, invoice_date || new Date(), due_date, subtotal, discount_amount, total, notes, req.user.id]
    );
    const invoice = invoiceResult.rows[0];

    // Create invoice items
    for (const item of (items || [])) {
      const itemTotal = (item.qty * item.unit_price) - (item.discount || 0);
      await client.query(
        `INSERT INTO invoice_items (business_id, invoice_id, product_id, product_name, qty, unit_price, discount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [req.business_id, invoice.id, item.product_id, item.product_name, item.qty, item.unit_price, item.discount || 0, itemTotal]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(invoice);

    // Send invoice email (async)
    if (customer_id) {
      const customerResult = await query('SELECT * FROM customers WHERE id = $1 AND business_id = $2', [customer_id, req.business_id]);
      if (customerResult.rows[0]?.email) {
        sendInvoiceEmail(customerResult.rows[0].email, invoice, customerResult.rows[0]).catch(console.error);
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, due_date, notes, customer_id, items, discount_amount } = req.body;
    
    const existingInvoice = await query(
      'SELECT * FROM invoices WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    
    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    let subtotal = existingInvoice.rows[0].subtotal;
    if (items && items.length > 0) {
      await query('DELETE FROM invoice_items WHERE invoice_id = $1 AND business_id = $2', [req.params.id, req.business_id]);
      
      subtotal = 0;
      for (const item of items) {
        const itemTotal = (item.qty * item.unit_price) - (item.discount || 0);
        subtotal += itemTotal;
        await query(
          `INSERT INTO invoice_items (business_id, invoice_id, product_id, product_name, qty, unit_price, discount, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [req.business_id, req.params.id, item.product_id, item.product_name, item.qty, item.unit_price, item.discount || 0, itemTotal]
        );
      }
    }
    
    const total = subtotal - (discount_amount || existingInvoice.rows[0].discount_amount);
    const paidDate = status === 'paid' ? new Date() : existingInvoice.rows[0].paid_date;
    
    const result = await query(
      `UPDATE invoices 
       SET status = COALESCE($1, status), customer_id = COALESCE($2, customer_id), due_date = COALESCE($3, due_date), 
           notes = COALESCE($4, notes), subtotal = $5, discount_amount = $6, total = $7, 
           paid_date = $8, updated_at = NOW()
       WHERE id = $9 AND business_id = $10
       RETURNING *`,
      [status, customer_id, due_date, notes, subtotal, discount_amount || existingInvoice.rows[0].discount_amount, total, paidDate, req.params.id, req.business_id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM invoice_items WHERE invoice_id = $1 AND business_id = $2', [req.params.id, req.business_id]);
    
    const result = await query(
      'DELETE FROM invoices WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;