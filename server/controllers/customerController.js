import { query } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { customerSchema, customerUpdateSchema } from '../utils/schemas.js';
import { logAction } from '../utils/actionLogger.js';

const log = (req, action, result, resourceId) => {
  logAction({
    businessId: req.business_id, userId: req.user?.id, action, result,
    resourceType: 'customers', resourceId, ip: req.ip, userAgent: req.get('User-Agent'),
  }).catch(() => {});
};

export const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM customers WHERE business_id = $1 ORDER BY created_at DESC', [req.business_id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(new AppError('Server error', 500)); }
};

export const getById = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM customers WHERE id = $1 AND business_id = $2', [req.params.id, req.business_id]);
    if (!result.rows.length) throw new AppError('Customer not found', 404);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { if (err.status) return next(err); next(new AppError('Server error', 500)); }
};

export const create = async (req, res, next) => {
  try {
    const { error, value } = customerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) throw Object.assign(error, { status: 422 });
    const r = await query(
      `INSERT INTO customers (business_id, name, email, phone, address, company, notes, credit_limit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.business_id, value.name, value.email, value.phone, value.address, value.company, value.notes, value.credit_limit || 0]
    );
    log(req, 'Customer Created', 'success', r.rows[0].id);
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) { if (err.isJoi || err.status) return next(err); next(new AppError('Server error', 500)); }
};

export const update = async (req, res, next) => {
  try {
    const { error, value } = customerUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) throw Object.assign(error, { status: 422 });
    const fields = []; const vals = []; let i = 1;
    for (const [k, v] of Object.entries(value)) { if (v !== undefined) { fields.push(`${k}=$${i++}`); vals.push(v); } }
    if (!fields.length) throw new AppError('No fields to update', 400);
    vals.push(req.params.id, req.business_id);
    const r = await query(`UPDATE customers SET ${fields.join(', ')}, updated_at=NOW() WHERE id=$${i++} AND business_id=$${i} RETURNING *`, vals);
    if (!r.rows.length) throw new AppError('Customer not found', 404);
    log(req, 'Customer Updated', 'success', req.params.id);
    res.json({ success: true, data: r.rows[0] });
  } catch (err) { if (err.isJoi || err.status) return next(err); next(new AppError('Server error', 500)); }
};

export const remove = async (req, res, next) => {
  try {
    const r = await query('DELETE FROM customers WHERE id=$1 AND business_id=$2 RETURNING id', [req.params.id, req.business_id]);
    if (!r.rows.length) throw new AppError('Customer not found', 404);
    log(req, 'Customer Deleted', 'success', req.params.id);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { if (err.status) return next(err); next(new AppError('Server error', 500)); }
};
