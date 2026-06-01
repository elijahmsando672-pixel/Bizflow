import express from 'express';
import { query, pool } from '../config/db.js';

const router = express.Router();

function generateReceiptHTML(business, sale, items) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.product_name || item.name || 'Item'}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">KSh ${parseFloat(item.unit_price || item.price || 0).toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">KSh ${parseFloat(item.total || item.qty * (item.unit_price || item.price || 0)).toLocaleString()}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${sale.invoice_number || sale.receipt_number || 'N/A'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #4f46e5; margin-bottom: 20px; }
    .logo h1 { font-size: 28px; color: #4f46e5; }
    .logo p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .receipt-info { text-align: right; }
    .receipt-info .receipt-number { font-size: 22px; font-weight: bold; color: #4f46e5; }
    .receipt-info p { font-size: 13px; color: #64748b; margin-top: 2px; }
    .customer-section { margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; }
    .customer-section h3 { font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
    .customer-section p { font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .totals { float: right; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.total { font-size: 20px; font-weight: bold; color: #4f46e5; border-top: 2px solid #4f46e5; padding-top: 10px; margin-top: 6px; }
    .footer { clear: both; margin-top: 60px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #94a3b8; }
    .payment-badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; margin-top: 8px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="position:fixed;top:20px;right:20px;padding:10px 20px;background:#4f46e5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Print Receipt</button>
  <div class="header">
    <div class="logo">
      <h1>${business.name || 'BizFlow'}</h1>
      <p>${business.phone || ''}${business.address ? '<br>' + business.address : ''}</p>
      ${business.tax_id ? `<p style="margin-top:4px;">Tax ID: ${business.tax_id}</p>` : ''}
    </div>
    <div class="receipt-info">
      <div class="receipt-number">${sale.invoice_number || sale.receipt_number || 'RECEIPT'}</div>
      <p>Sale Date: ${new Date(sale.sale_date || sale.created_at).toLocaleDateString()}</p>
      ${sale.paid_date ? `<p>Paid: ${new Date(sale.paid_date).toLocaleDateString()}</p>` : ''}
      <div class="payment-badge">PAID</div>
    </div>
  </div>
  ${sale.customer_name ? `
  <div class="customer-section">
    <h3>Customer</h3>
    <p><strong>${sale.customer_name}</strong></p>
    ${sale.customer_phone ? `<p>Phone: ${sale.customer_phone}</p>` : ''}
    ${sale.customer_email ? `<p>Email: ${sale.customer_email}</p>` : ''}
  </div>
  ` : ''}
  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>KSh ${parseFloat(sale.subtotal || 0).toLocaleString()}</span></div>
    ${sale.discount_amount > 0 ? `<div class="totals-row" style="color:#dc2626;"><span>Discount</span><span>- KSh ${parseFloat(sale.discount_amount || 0).toLocaleString()}</span></div>` : ''}
    ${sale.tax_amount > 0 ? `<div class="totals-row"><span>Tax (16%)</span><span>KSh ${parseFloat(sale.tax_amount || 0).toLocaleString()}</span></div>` : ''}
    <div class="totals-row total"><span>Total Paid</span><span>KSh ${parseFloat(sale.total || 0).toLocaleString()}</span></div>
  </div>
  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p style="margin-top:4px;">Powered by <strong>BizFlow</strong> &bull; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;
}

async function generateReceipt(businessId, saleId) {
  try {
    const saleResult = await query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND s.business_id = $2`,
      [saleId, businessId]
    );
    if (!saleResult.rows.length) return null;

    const sale = saleResult.rows[0];

    const existingReceipt = await query(
      `SELECT id FROM receipts WHERE sale_id = $1 AND business_id = $2`,
      [saleId, businessId]
    );
    if (existingReceipt.rows.length) return existingReceipt.rows[0];

    const itemsResult = await query(
      `SELECT * FROM sale_items WHERE sale_id = $1 AND business_id = $2 ORDER BY id`,
      [saleId, businessId]
    );

    const businessResult = await query(
      `SELECT name, phone, address, tax_id FROM businesses WHERE id = $1`,
      [businessId]
    );
    const business = businessResult.rows[0] || {};

    const receiptCounter = await query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 5) AS INTEGER)), 0) as max_num FROM receipts WHERE business_id = $1`,
      [businessId]
    );
    const receiptNumber = `RCP-${String(parseInt(receiptCounter.rows[0].max_num) + 1).padStart(5, '0')}`;

    const receiptHTML = generateReceiptHTML(business, sale, itemsResult.rows);

    const receipt = await query(
      `INSERT INTO receipts (business_id, sale_id, receipt_number, customer_name, customer_phone, items, subtotal, discount_amount, tax_amount, total, receipt_html)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        businessId,
        saleId,
        receiptNumber,
        sale.customer_name || null,
        sale.customer_phone || null,
        JSON.stringify(itemsResult.rows),
        sale.subtotal || 0,
        sale.discount_amount || 0,
        sale.tax_amount || 0,
        sale.total || 0,
        receiptHTML,
      ]
    );

    return receipt.rows[0];
  } catch (error) {
    console.error('Receipt generation error:', error);
    return null;
  }
}

router.get('/', async (req, res) => {
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
     console.error('Sales route error:', err);
     res.status(500).json({ error: 'Server error' });
   }
});

// Receipt endpoints (MUST come before /:id)
router.get('/receipts', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, s.invoice_number, s.sale_date, c.name as customer_name
       FROM receipts r
       LEFT JOIN sales s ON r.sale_id = s.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Receipts error:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

router.get('/:saleId/receipt', async (req, res) => {
  try {
    const saleId = req.params.saleId;
    const receipt = await query(
      `SELECT * FROM receipts WHERE sale_id = $1 AND business_id = $2`,
      [saleId, req.business_id]
    );

    if (!receipt.rows.length) {
      const sale = await query(
        `SELECT status FROM sales WHERE id = $1 AND business_id = $2`,
        [saleId, req.business_id]
      );
      if (!sale.rows.length) return res.status(404).json({ error: 'Sale not found' });
      if (sale.rows[0].status !== 'paid') return res.status(400).json({ error: 'Receipt only available for paid sales' });

      const newReceipt = await generateReceipt(req.business_id, saleId);
      return res.status(201).json(newReceipt);
    }

    res.json(receipt.rows[0]);
  } catch (error) {
    console.error('Receipt error:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

router.get('/:saleId/receipt/html', async (req, res) => {
  try {
    const saleId = req.params.saleId;
    let receipt = await query(
      `SELECT * FROM receipts WHERE sale_id = $1 AND business_id = $2`,
      [saleId, req.business_id]
    );

    if (!receipt.rows.length) {
      const sale = await query(
        `SELECT status FROM sales WHERE id = $1 AND business_id = $2`,
        [saleId, req.business_id]
      );
      if (!sale.rows.length) return res.status(404).json({ error: 'Sale not found' });
      if (sale.rows[0].status !== 'paid') return res.status(400).json({ error: 'Receipt only available for paid sales' });

      const newReceipt = await generateReceipt(req.business_id, saleId);
      if (!newReceipt) return res.status(500).json({ error: 'Failed to generate receipt' });
      receipt = { rows: [newReceipt] };
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(receipt.rows[0].receipt_html);
  } catch (error) {
    console.error('Receipt HTML error:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

router.get('/:id', async (req, res) => {
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

    const receiptResult = await query(
      'SELECT id, receipt_number FROM receipts WHERE sale_id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );

    res.json({ ...saleResult.rows[0], items: itemsResult.rows, receipt: receiptResult.rows[0] || null });
   } catch (err) {
     console.error('Sales route error:', err);
     res.status(500).json({ error: 'Server error' });
   }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, sale_date, due_date, items, notes, discount_amount = 0, status = 'draft' } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const invResult = await client.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1 as next_num FROM sales"
    );
    const saleNumber = `SAL-${String(parseInt(invResult.rows[0].next_num)).padStart(5, '0')}`;

    let subtotal = 0;
    for (const item of (items || [])) {
      subtotal += (item.qty * item.unit_price) - (item.discount || 0);
    }
    const taxAmount = subtotal * 0.16;
    const total = Math.max(0, subtotal - discount_amount);

    const saleResult = await client.query(
      `INSERT INTO sales (business_id, customer_id, invoice_number, sale_date, due_date, subtotal, tax_amount, discount_amount, total, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.business_id, customer_id, saleNumber, sale_date || new Date(), due_date, subtotal, taxAmount, discount_amount, total, notes, status, req.user.id]
    );
    const sale = saleResult.rows[0];

    for (const item of (items || [])) {
      const itemTotal = (item.qty * item.unit_price) - (item.discount || 0);

      await client.query(
        `INSERT INTO sale_items (business_id, sale_id, product_id, product_name, qty, unit_price, discount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [req.business_id, sale.id, item.product_id, item.product_name, item.qty, item.unit_price, item.discount || 0, itemTotal]
      );

      if (item.product_id) {
        const productResult = await client.query('SELECT stock_qty FROM products WHERE id = $1', [item.product_id]);
        const oldQty = productResult.rows[0]?.stock_qty || 0;
        const newQty = oldQty - item.qty;

        await client.query(
          'UPDATE products SET stock_qty = $1, updated_at = NOW() WHERE id = $2',
          [newQty, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (business_id, product_id, qty_before, qty_change, qty_after, reason, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, 'sale', 'sale', $6)`,
          [req.business_id, item.product_id, oldQty, -item.qty, newQty, sale.id]
        );
      }
    }

    if (total > 0) {
      await client.query(
        `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
         VALUES ($1, 'inflow', $2, $3, $4, 'sale', $5)`,
        [req.business_id, total, sale_date || new Date(), `Sale ${saleNumber}`, sale.id]
      );
    }

    await client.query('COMMIT');

    if (status === 'paid') {
      generateReceipt(req.business_id, sale.id).catch(err => console.error('Auto-receipt error:', err));
    }

    res.status(201).json(sale);
   } catch (err) {
     await client.query('ROLLBACK');
     console.error('Sales route error:', err);
     res.status(500).json({ error: 'Server error' });
   }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;

    let paidDate = null;
    if (status === 'paid') {
      paidDate = new Date();
    }

    const result = await query(
      `UPDATE sales SET status = COALESCE($1, status), notes = COALESCE($2, notes), amount_paid = CASE WHEN $1 = 'paid' THEN total ELSE amount_paid END,
       paid_date = CASE WHEN $1 = 'paid' THEN $3 ELSE paid_date END,
       updated_at = NOW() WHERE id = $4 AND business_id = $5 RETURNING *`,
      [status, notes, paidDate, req.params.id, req.business_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    if (status === 'paid') {
      generateReceipt(req.business_id, req.params.id).catch(err => console.error('Auto-receipt error:', err));
    }

    res.json(result.rows[0]);
   } catch (err) {
     console.error('Sales route error:', err);
     res.status(500).json({ error: 'Server error' });
   }
});

router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const saleResult = await client.query('SELECT id FROM sales WHERE id = $1 AND business_id = $2', [req.params.id, req.business_id]);
    if (saleResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const items = await client.query('SELECT product_id, qty FROM sale_items WHERE sale_id = $1 AND business_id = $2', [req.params.id, req.business_id]);

    for (const item of items.rows) {
      if (item.product_id) {
        await client.query(
          'UPDATE products SET stock_qty = stock_qty + $1, updated_at = NOW() WHERE id = $2',
          [item.qty, item.product_id]
        );
      }
    }

    await client.query('DELETE FROM cashflow_entries WHERE source_id = $1 AND source_type = $2 AND business_id = $3', [req.params.id, 'sale', req.business_id]);
    await client.query('DELETE FROM receipts WHERE sale_id = $1 AND business_id = $2', [req.params.id, req.business_id]);
    await client.query('DELETE FROM sale_items WHERE sale_id = $1 AND business_id = $2', [req.params.id, req.business_id]);
    await client.query('DELETE FROM sales WHERE id = $1 AND business_id = $2', [req.params.id, req.business_id]);

    await client.query('COMMIT');
    res.json({ message: 'Deleted' });
   } catch (err) {
     await client.query('ROLLBACK');
     console.error('Sales route error:', err);
     res.status(500).json({ error: 'Server error' });
   }
});

export default router;
