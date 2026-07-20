import { query, pool } from '../config/db.js';
import { sendInvoiceEmail } from '../utils/email.js';

const TAX_RATE = 0.16;

async function generateInvoiceNumber(client, businessId) {
  const result = await client.query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1 as next_num FROM invoices WHERE business_id = $1",
    [businessId]
  );
  return `INV-${String(parseInt(result.rows[0].next_num)).padStart(5, '0')}`;
}

function calculateTotals(items, discountAmount) {
  let subtotal = 0;
  for (const item of items) {
    subtotal += (item.qty * item.unit_price) - (item.discount || 0);
  }
  const taxAmount = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);
  return { subtotal, taxAmount, total };
}

async function insertInvoiceItems(client, businessId, invoiceId, items) {
  for (const item of items) {
    const itemTotal = (item.qty * item.unit_price) - (item.discount || 0);
    await client.query(
      `INSERT INTO invoice_items (business_id, invoice_id, product_id, product_name, qty, unit_price, discount, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [businessId, invoiceId, item.product_id, item.product_name, item.qty, item.unit_price, item.discount || 0, itemTotal]
    );
  }
}

async function sendInvoiceNotification(customerId, invoice, businessId) {
  try {
    const customerResult = await query(
      'SELECT * FROM customers WHERE id = $1 AND business_id = $2',
      [customerId, businessId]
    );
    if (customerResult.rows[0]?.email) {
      sendInvoiceEmail(customerResult.rows[0].email, invoice, customerResult.rows[0]).catch(() => {});
    }
  } catch (err) {
    console.error('Send invoice email error:', err);
  }
}

export async function createInvoice(businessId, userId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, invoice_date, due_date, items = [], notes, discount_amount = 0 } = data;
    if (!items.length) {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('At least one item is required'), { statusCode: 400 });
    }

    const invoiceNumber = await generateInvoiceNumber(client, businessId);
    const { subtotal, taxAmount, total } = calculateTotals(items, discount_amount);

    const invoiceResult = await client.query(
      `INSERT INTO invoices (business_id, customer_id, invoice_number, invoice_date, due_date, subtotal, tax_amount, discount_amount, total, notes, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft') RETURNING *`,
      [businessId, customer_id, invoiceNumber, invoice_date || new Date(), due_date, subtotal, taxAmount, discount_amount, total, notes, userId]
    );
    const invoice = invoiceResult.rows[0];

    await insertInvoiceItems(client, businessId, invoice.id, items);

    await client.query('COMMIT');

    if (customer_id) {
      sendInvoiceNotification(customer_id, invoice, businessId);
    }

    return invoice;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateInvoice(businessId, invoiceId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { status, due_date, notes, customer_id, items, discount_amount } = data;

    const existingInvoice = await client.query(
      'SELECT * FROM invoices WHERE id = $1 AND business_id = $2 FOR UPDATE',
      [invoiceId, businessId]
    );
    if (!existingInvoice.rows.length) {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    }

    let subtotal = existingInvoice.rows[0].subtotal;
    if (items && items.length > 0) {
      await client.query('DELETE FROM invoice_items WHERE invoice_id = $1 AND business_id = $2', [invoiceId, businessId]);
      await insertInvoiceItems(client, businessId, invoiceId, items);
      subtotal = calculateTotals(items, discount_amount || existingInvoice.rows[0].discount_amount).subtotal;
    }

    const finalDiscount = discount_amount ?? existingInvoice.rows[0].discount_amount;
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount - finalDiscount;
    const paidDate = status === 'paid' ? new Date() : existingInvoice.rows[0].paid_date;

    const result = await client.query(
      `UPDATE invoices 
       SET status = COALESCE($1, status), customer_id = COALESCE($2, customer_id), due_date = COALESCE($3, due_date),
           notes = COALESCE($4, notes), subtotal = $5, tax_amount = $6, discount_amount = $7, total = $8,
           paid_date = $9, updated_at = NOW()
       WHERE id = $10 AND business_id = $11
       RETURNING *`,
      [status, customer_id, due_date, notes, subtotal, taxAmount, finalDiscount, total, paidDate, invoiceId, businessId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteInvoice(businessId, invoiceId) {
  const result = await query(
    'DELETE FROM invoices WHERE id = $1 AND business_id = $2 RETURNING id',
    [invoiceId, businessId]
  );
  if (!result.rows.length) {
    throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  }
}

export async function getInvoiceById(businessId, invoiceId) {
  const invoiceResult = await query(
    `SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
     FROM invoices i 
     LEFT JOIN customers c ON i.customer_id = c.id 
     WHERE i.id = $1 AND i.business_id = $2`,
    [invoiceId, businessId]
  );
  if (!invoiceResult.rows.length) return null;

  const itemsResult = await query(
    'SELECT * FROM invoice_items WHERE invoice_id = $1 AND business_id = $2',
    [invoiceId, businessId]
  );
  return { ...invoiceResult.rows[0], items: itemsResult.rows };
}

export async function getInvoices(businessId, status) {
  let sql = `SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.business_id = $1`;
  const params = [businessId];

  if (status) {
    sql += ' AND i.status = $2';
    params.push(status);
  }

  sql += ' ORDER BY i.created_at DESC';
  const result = await query(sql, params);
  return result.rows;
}
