import express from 'express';
import Joi from 'joi';
import { query, pool } from '../config/db.js';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

const debtorSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  opening_balance: Joi.number().min(0).allow(0, null),
  notes: Joi.string().allow('', null),
});

const debtorInvoiceSchema = Joi.object({
  reference: Joi.string().min(1).max(100).required(),
  amount: Joi.number().positive().required(),
  due_date: Joi.date().allow('', null),
  date: Joi.date().allow('', null),
  notes: Joi.string().allow('', null),
});

const debtorPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  date: Joi.date().allow('', null),
  reference: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return sendError(res, 400, error.details.map(d => d.message).join(', '));
  req.body = value;
  next();
};

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT d.*,
      COALESCE((SELECT SUM(amount) FROM debtor_invoices WHERE debtor_id = d.id), 0) as total_owed,
      COALESCE((SELECT SUM(amount) FROM debtor_payments WHERE debtor_id = d.id), 0) as total_paid
      FROM debtors d WHERE d.business_id = $1`;

    const params = [req.business_id];
    if (status === 'overdue') {
      sql += ` AND d.id IN (SELECT debtor_id FROM debtor_invoices WHERE business_id = $1 AND is_paid = false AND due_date < CURRENT_DATE)`;
    }

    sql += ' ORDER BY d.name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get debtors error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.post('/', validate(debtorSchema), async (req, res) => {
  try {
    const { name, email, phone, address, opening_balance, notes } = req.body;

    const result = await query(
      `INSERT INTO debtors (business_id, name, email, phone, address, opening_balance, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.business_id, name, email, phone, address, opening_balance || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create debtor error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.put('/:id', validate(debtorSchema), async (req, res) => {
  try {
    const { name, email, phone, address, opening_balance, notes } = req.body;
    const result = await query(
      `UPDATE debtors SET name=$1, email=$2, phone=$3, address=$4, opening_balance=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 AND business_id=$8 RETURNING *`,
      [name, email, phone, address, opening_balance, notes, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update debtor error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM debtors WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Not found');
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete debtor error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.get('/:id/invoices', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM debtor_invoices WHERE debtor_id = $1 AND business_id = $2 ORDER BY date DESC',
      [req.params.id, req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get debtor invoices error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.post('/:id/invoices', validate(debtorInvoiceSchema), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { reference, amount, due_date, date, notes } = req.body;

    const invoiceResult = await client.query(
      `INSERT INTO debtor_invoices (business_id, debtor_id, reference, amount, due_date, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.business_id, req.params.id, reference, amount, due_date, date || new Date(), notes]
    );

    await client.query(
      `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
       VALUES ($1, 'inflow', $2, $3, $4, 'debtor_invoice', $5)`,
      [req.business_id, amount, date || new Date(), `Debtor invoice: ${reference}`, invoiceResult.rows[0].id]
    );

    await client.query('COMMIT');
    res.status(201).json(invoiceResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create debtor invoice error:', err);
    sendError(res, 500, 'Server error');
  } finally {
    client.release();
  }
});

router.post('/:id/payments', validate(debtorPaymentSchema), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { amount, date, reference, notes } = req.body;

    const paymentResult = await client.query(
      `INSERT INTO debtor_payments (business_id, debtor_id, amount, date, reference, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.business_id, req.params.id, amount, date || new Date(), reference, notes, req.user.id]
    );

    await client.query(
      `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
       VALUES ($1, 'inflow', $2, $3, $4, 'debtor_payment', $5)`,
      [req.business_id, amount, date || new Date(), `Payment from debtor: ${reference || ''}`, paymentResult.rows[0].id]
    );

    await client.query('COMMIT');
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Record debtor payment error:', err);
    sendError(res, 500, 'Server error');
  } finally {
    client.release();
  }
});

router.get('/summary', async (req, res) => {
  try {
    const totalOwed = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM debtor_invoices WHERE business_id = $1 AND is_paid = false`,
      [req.business_id]
    );
    const totalPaid = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM debtor_payments WHERE business_id = $1`,
      [req.business_id]
    );
    const overdue = await query(
      `SELECT COUNT(*) as count FROM debtor_invoices WHERE business_id = $1 AND is_paid = false AND due_date < CURRENT_DATE`,
      [req.business_id]
    );

    res.json({
      totalOwed: parseFloat(totalOwed.rows[0].total),
      totalPaid: parseFloat(totalPaid.rows[0].total),
      overdueCount: parseInt(overdue.rows[0].count),
    });
  } catch (err) {
    console.error('Get debtor summary error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.put('/invoices/:invoiceId/pay', async (req, res) => {
  try {
    const result = await query(
      `UPDATE debtor_invoices SET is_paid = true WHERE id = $1 AND business_id = $2 RETURNING *`,
      [req.params.invoiceId, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Invoice not found');
    res.json({ message: 'Invoice marked as paid', invoice: result.rows[0] });
  } catch (err) {
    console.error('Mark invoice paid error:', err);
    sendError(res, 500, 'Server error');
  }
});

export default router;
