import sanitizeHtml from 'sanitize-html';
import { query, pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { assertOwned, assertAllOwned, collectIds } from '../utils/tenantGuard.js';
import { calculateTotals, loadTaxRate, roundMoney } from '../utils/money.js';

function sanitize(str) {
  return sanitizeHtml(String(str || ''), { allowedTags: [], allowedAttributes: {} });
}

function generateReceiptHTML(business, sale, items, taxRatePercent) {
  // Printed from the rate the sale was charged, not a literal. A receipt reading
  // "Tax (16%)" on a zero-rated or exempt sale is a document that contradicts its
  // own line items, and it is the document the customer keeps.
  const taxRateLabel = Number.isFinite(Number(taxRatePercent)) ? `${roundMoney(taxRatePercent)}%` : '';

  const rows = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${sanitize(item.product_name || item.name || 'Item')}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${sanitize(item.qty)}</td>
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
      <h1>${sanitize(business.name) || 'BizFlow'}</h1>
      <p>${sanitize(business.phone) || ''}${business.address ? '<br>' + sanitize(business.address) : ''}</p>
      ${business.tax_id ? `<p style="margin-top:4px;">Tax ID: ${sanitize(business.tax_id)}</p>` : ''}
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
    <p><strong>${sanitize(sale.customer_name)}</strong></p>
    ${sale.customer_phone ? `<p>Phone: ${sanitize(sale.customer_phone)}</p>` : ''}
    ${sale.customer_email ? `<p>Email: ${sanitize(sale.customer_email)}</p>` : ''}
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
    ${sale.tax_amount > 0 ? `<div class="totals-row"><span>Tax (${taxRateLabel})</span><span>KSh ${parseFloat(sale.tax_amount || 0).toLocaleString()}</span></div>` : ''}
    <div class="totals-row total"><span>Total Paid</span><span>KSh ${parseFloat(sale.total || 0).toLocaleString()}</span></div>
  </div>
  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p style="margin-top:4px;">Powered by <strong>BizFlow</strong> &bull; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;
}

async function deductInventory(client, businessId, items) {
  for (const item of items) {
    if (item.product_id) {
      // business_id in the predicate as well as the id: the row lock and the stock
      // update must both be confined to this tenant.
      const productResult = await client.query(
        'SELECT stock_qty FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE',
        [item.product_id, businessId]
      );
      const currentStock = productResult.rows[0]?.stock_qty;
      if (currentStock === undefined) {
        throw new AppError(`Product not found`, 404);
      }
      if (currentStock < item.qty) {
        throw new Error(`Insufficient stock for ${item.product_name || 'item'}. Available: ${currentStock}, requested: ${item.qty}`);
      }
      const newQty = currentStock - item.qty;
      await client.query(
        'UPDATE products SET stock_qty = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3',
        [newQty, item.product_id, businessId]
      );
      await client.query(
        `INSERT INTO stock_movements (business_id, product_id, qty_before, qty_change, qty_after, reason, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, 'sale', 'sale', $6)`,
        [businessId, item.product_id, currentStock, -item.qty, newQty, item.saleId]
      );
    }
  }
}

async function restoreInventory(client, businessId, saleId) {
  const items = await client.query(
    'SELECT product_id, qty FROM sale_items WHERE sale_id = $1 AND business_id = $2',
    [saleId, businessId]
  );
  for (const item of items.rows) {
    if (item.product_id) {
      await client.query(
        'UPDATE products SET stock_qty = stock_qty + $1, updated_at = NOW() WHERE id = $2 AND business_id = $3',
        [item.qty, item.product_id, businessId]
      );
    }
  }
}

async function createCashflowEntry(client, businessId, saleId, total, saleDate, saleNumber) {
  if (total > 0) {
    await client.query(
      `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
       VALUES ($1, 'inflow', $2, $3, $4, 'sale', $5)`,
      [businessId, total, saleDate || new Date(), `Sale ${saleNumber}`, saleId]
    );
  }
}

async function generateReceiptNumberStandalone(businessId) {
  const counter = await query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 5) AS INTEGER)), 0) as max_num FROM receipts WHERE business_id = $1`,
    [businessId]
  );
  return `RCP-${String(parseInt(counter.rows[0].max_num) + 1).padStart(5, '0')}`;
}

async function generateSaleNumber(client, businessId) {
  const result = await client.query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1 as next_num FROM sales WHERE business_id = $1",
    [businessId]
  );
  return `SAL-${String(parseInt(result.rows[0].next_num)).padStart(5, '0')}`;
}

export async function createSale(businessId, userId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, sale_date, due_date, items = [], notes, discount_amount = 0, status = 'draft', amount_paid } = data;
    if (!items.length) {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('At least one item is required'), { statusCode: 400 });
    }

    const saleNumber = await generateSaleNumber(client, businessId);

    // Every request-supplied foreign key has to belong to this tenant before it is
    // written or used to mutate another table. Without this a caller can point a sale
    // at another business's customer, product or user and both read their data back
    // through the joins below.
    await assertOwned(client, 'customers', customer_id, businessId, 'Customer');
    await assertAllOwned(client, 'products', collectIds(items, 'product_id'), businessId, 'Product');

    const taxRate = await loadTaxRate(client, businessId);
    const { subtotal, taxAmount, total } = calculateTotals({
      items,
      orderDiscount: discount_amount,
      taxRatePercent: taxRate,
    });

    const saleResult = await client.query(
      `INSERT INTO sales (business_id, customer_id, invoice_number, sale_date, due_date, subtotal, tax_amount, discount_amount, total, amount_paid, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [businessId, customer_id, saleNumber, sale_date || new Date(), due_date, subtotal, taxAmount, discount_amount, total, amount_paid || 0, notes, status, userId]
    );
    const sale = saleResult.rows[0];

    for (const item of items) {
      // product_name is NOT NULL, and a caller sending only a product_id left it
      // null, so the whole sale failed with a 500 on a column it never populated.
      // The product row is this tenant's (assertAllOwned above), so its name is a
      // safe fallback and keeps the line readable on the receipt and in reports
      // after the product is later renamed or deleted.
      let productName = item.product_name;
      if (!productName && item.product_id) {
        const { rows } = await client.query(
          'SELECT name FROM products WHERE id = $1 AND business_id = $2',
          [item.product_id, businessId]
        );
        productName = rows[0]?.name;
      }

      await client.query(
        `INSERT INTO sale_items (business_id, sale_id, product_id, product_name, qty, unit_price, discount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          businessId, sale.id, item.product_id, productName || 'Item',
          item.qty, item.unit_price, item.discount || 0,
          roundMoney((item.qty * item.unit_price) - (item.discount || 0)),
        ]
      );
      if (item.product_id) {
        item.saleId = sale.id;
      }
    }

    if (status === 'paid' || status === 'completed') {
      await deductInventory(client, businessId, items);
    }

    await createCashflowEntry(client, businessId, sale.id, total, sale_date || new Date(), saleNumber);

    await client.query('COMMIT');

    if (status === 'paid' || status === 'completed') {
      generateReceipt(businessId, sale.id).catch(err => console.error('Auto-receipt error:', err));
    }

    return sale;
  } catch (err) {
    await client.query('ROLLBACK');
    // Logged here rather than only at the route: a 500 from a sale is a money bug
    // and the reason is otherwise invisible, since the route forwards anything
    // that is not a 400 to the error middleware as an empty body.
    console.error('createSale error:', err);
    throw err;
  } finally {
    client.release();
  }
}

export async function updateSale(businessId, saleId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { status, notes } = data;

    const saleResult = await client.query(
      'SELECT id, status, total FROM sales WHERE id = $1 AND business_id = $2 FOR UPDATE',
      [saleId, businessId]
    );
    if (!saleResult.rows.length) {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
    }

    const currentSale = saleResult.rows[0];
    // Both 'paid' and 'completed' count as settled: createSale deducts inventory for
    // either, so treating only 'paid' as the settlement transition re-deducted stock
    // when a completed sale was later marked paid.
    const SETTLED = new Set(['paid', 'completed']);
    const wasSettled = SETTLED.has(currentSale.status);
    const nowSettled = SETTLED.has(status);
    const transitioningToSettled = nowSettled && !wasSettled;
    let paidDate = null;

    if (transitioningToSettled) {
      paidDate = new Date();
      const items = await client.query(
        'SELECT product_id, qty, product_name FROM sale_items WHERE sale_id = $1 AND business_id = $2',
        [saleId, businessId]
      );
      for (const item of items.rows) {
        if (item.product_id) {
          const productResult = await client.query(
            'SELECT stock_qty FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE',
            [item.product_id, businessId]
          );
          const currentStock = productResult.rows[0]?.stock_qty;
          if (currentStock === undefined) {
            await client.query('ROLLBACK');
            throw Object.assign(new Error(`Product not found`), { statusCode: 404 });
          }
          if (currentStock < item.qty) {
            await client.query('ROLLBACK');
            throw Object.assign(new Error(`Insufficient stock for ${item.product_name}. Available: ${currentStock}, requested: ${item.qty}`), { statusCode: 400 });
          }
          const newQty = currentStock - item.qty;
          await client.query(
            'UPDATE products SET stock_qty = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3',
            [newQty, item.product_id, businessId]
          );
          await client.query(
            `INSERT INTO stock_movements (business_id, product_id, qty_before, qty_change, qty_after, reason, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, 'sale', 'sale', $6)`,
            [businessId, item.product_id, currentStock, -item.qty, newQty, saleId]
          );
        }
      }
    }

    const result = await client.query(
      `UPDATE sales SET status = COALESCE($1, status), notes = COALESCE($2, notes),
       amount_paid = CASE WHEN $6 THEN total ELSE amount_paid END,
       paid_date = CASE WHEN $6 THEN $3 ELSE paid_date END,
       updated_at = NOW() WHERE id = $4 AND business_id = $5 RETURNING *`,
      [status, notes, paidDate, saleId, businessId, nowSettled]
    );

    await client.query('COMMIT');

    if (transitioningToSettled) {
      generateReceipt(businessId, saleId).catch(err => console.error('Auto-receipt error:', err));
    }

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteSale(businessId, saleId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const saleResult = await client.query('SELECT id FROM sales WHERE id = $1 AND business_id = $2', [saleId, businessId]);
    if (!saleResult.rows.length) {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
    }

    await restoreInventory(client, businessId, saleId);
    await client.query('DELETE FROM cashflow_entries WHERE source_id = $1 AND source_type = $2 AND business_id = $3', [saleId, 'sale', businessId]);
    await client.query('DELETE FROM receipts WHERE sale_id = $1 AND business_id = $2', [saleId, businessId]);
    await client.query('DELETE FROM sale_items WHERE sale_id = $1 AND business_id = $2', [saleId, businessId]);
    await client.query('DELETE FROM sales WHERE id = $1 AND business_id = $2', [saleId, businessId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function generateReceipt(businessId, saleId) {
  try {
    const saleResult = await query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id AND c.business_id = s.business_id
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
      `SELECT name, phone, address, tax_id, tax_rate FROM businesses WHERE id = $1`,
      [businessId]
    );
    const business = businessResult.rows[0] || {};

    const receiptNumber = await generateReceiptNumberStandalone(businessId);

    const receiptHTML = generateReceiptHTML(business, sale, itemsResult.rows, business.tax_rate);

    const receipt = await query(
      `INSERT INTO receipts (business_id, sale_id, receipt_number, customer_name, customer_phone, items, subtotal, discount_amount, tax_amount, total, receipt_html)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        businessId, saleId, receiptNumber,
        sale.customer_name || null, sale.customer_phone || null,
        JSON.stringify(itemsResult.rows),
        sale.subtotal || 0, sale.discount_amount || 0, sale.tax_amount || 0, sale.total || 0,
        receiptHTML,
      ]
    );

    return receipt.rows[0];
  } catch (error) {
    console.error('Receipt generation error:', error);
    return null;
  }
}

export async function getReceipt(businessId, saleId) {
  const receipt = await query(
    `SELECT * FROM receipts WHERE sale_id = $1 AND business_id = $2`,
    [saleId, businessId]
  );
  return receipt.rows[0] || null;
}

export async function getAllReceipts(businessId) {
  const result = await query(
    `SELECT r.*, s.invoice_number, s.sale_date, c.name as customer_name
     FROM receipts r
     LEFT JOIN sales s ON r.sale_id = s.id AND s.business_id = r.business_id
     LEFT JOIN customers c ON s.customer_id = c.id AND c.business_id = r.business_id
     WHERE r.business_id = $1
     ORDER BY r.created_at DESC`,
    [businessId]
  );
  return result.rows;
}

export async function getSaleById(businessId, saleId) {
  const saleResult = await query(
    `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
     FROM sales s LEFT JOIN customers c ON s.customer_id = c.id AND c.business_id = s.business_id
     WHERE s.id = $1 AND s.business_id = $2`,
    [saleId, businessId]
  );

  if (!saleResult.rows.length) return null;

  const itemsResult = await query(
    'SELECT * FROM sale_items WHERE sale_id = $1 AND business_id = $2',
    [saleId, businessId]
  );

  const receiptResult = await query(
    'SELECT id, receipt_number FROM receipts WHERE sale_id = $1 AND business_id = $2',
    [saleId, businessId]
  );

  return { ...saleResult.rows[0], items: itemsResult.rows, receipt: receiptResult.rows[0] || null };
}

export async function getSales(businessId, status) {
  let sql = `SELECT s.*, c.name as customer_name, c.email as customer_email 
             FROM sales s LEFT JOIN customers c ON s.customer_id = c.id AND c.business_id = s.business_id 
             WHERE s.business_id = $1`;
  const params = [businessId];

  if (status) {
    sql += ' AND s.status = $2';
    params.push(status);
  }

  sql += ' ORDER BY s.created_at DESC';
  const result = await query(sql, params);
  return result.rows;
}
