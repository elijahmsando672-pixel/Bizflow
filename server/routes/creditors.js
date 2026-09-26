import express from 'express';
import Joi from 'joi';
import { query, pool } from '../config/db.js';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

const creditorSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  opening_balance: Joi.number().min(0).allow(0, null),
  notes: Joi.string().allow('', null),
});

const creditorPaymentSchema = Joi.object({
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
    const result = await query(
      `SELECT c.*,
        COALESCE((SELECT SUM(amount) FROM creditor_purchases WHERE creditor_id = c.id AND is_paid = false), 0) as balance
       FROM creditors c WHERE c.business_id = $1 ORDER BY c.name`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get creditors error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.post('/', validate(creditorSchema), async (req, res) => {
  try {
    const { name, email, phone, address, opening_balance, notes } = req.body;

    const result = await query(
      `INSERT INTO creditors (business_id, name, email, phone, address, opening_balance, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.business_id, name, email, phone, address, opening_balance || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create creditor error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.put('/:id', validate(creditorSchema), async (req, res) => {
  try {
    const { name, email, phone, address, opening_balance, notes } = req.body;
    const result = await query(
      `UPDATE creditors SET name=$1, email=$2, phone=$3, address=$4, opening_balance=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 AND business_id=$8 RETURNING *`,
      [name, email, phone, address, opening_balance, notes, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update creditor error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM creditors WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return sendError(res, 404, 'Not found');
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete creditor error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.post('/:id/payments', validate(creditorPaymentSchema), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { amount, date, reference, notes } = req.body;

    const paymentResult = await client.query(
      `INSERT INTO creditor_payments (business_id, creditor_id, amount, date, reference, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.business_id, req.params.id, amount, date || new Date(), reference, notes, req.user.id]
    );

    await client.query(
      `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
       VALUES ($1, 'outflow', $2, $3, $4, 'creditor_payment', $5)`,
      [req.business_id, amount, date || new Date(), `Payment to creditor: ${reference || ''}`, paymentResult.rows[0].id]
    );

    await client.query('COMMIT');
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Record creditor payment error:', err);
    sendError(res, 500, 'Server error');
  } finally {
    client.release();
  }
});

export default router;
