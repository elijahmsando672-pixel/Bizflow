import express from 'express';
import { query, pool } from '../config/db.js';
import Joi from 'joi';

const router = express.Router();

const employeeSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  position: Joi.string().optional().allow('', null),
  department: Joi.string().optional().allow('', null),
  hire_date: Joi.date().required(),
  termination_date: Joi.date().optional().allow(null),
  status: Joi.string().valid('active', 'inactive', 'terminated').default('active'),
  salary: Joi.number().min(0).default(0),
  salary_type: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly', 'yearly').default('monthly'),
  bank_name: Joi.string().optional().allow('', null),
  bank_account: Joi.string().optional().allow('', null),
  id_number: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  emergency_contact_name: Joi.string().optional().allow('', null),
  emergency_contact_phone: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
});

router.get('/', async (req, res) => {
  try {
    const { department, status } = req.query;
    let sql = 'SELECT * FROM employees WHERE business_id = $1';
    const params = [req.business_id];

    if (department) { sql += ` AND department = $${params.length + 1}`; params.push(department); }
    if (status) { sql += ` AND status = $${params.length + 1}`; params.push(status); }

    sql += ' ORDER BY last_name, first_name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const { date, employee_id } = req.query;
    let sql = `SELECT a.*, e.first_name, e.last_name, e.position
               FROM attendance a
               LEFT JOIN employees e ON a.employee_id = e.id
               WHERE a.business_id = $1`;
    const params = [req.business_id];

    if (date) { sql += ` AND a.date = $${params.length + 1}`; params.push(date); }
    if (employee_id) { sql += ` AND a.employee_id = $${params.length + 1}`; params.push(employee_id); }

    sql += ' ORDER BY a.date DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get attendance list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/payroll', async (req, res) => {
  try {
    const { status, employee_id, period_start, period_end } = req.query;
    let sql = `SELECT p.*, e.first_name, e.last_name, e.position, e.department
               FROM payroll p
               LEFT JOIN employees e ON p.employee_id = e.id
               WHERE p.business_id = $1`;
    const params = [req.business_id];

    if (status) { sql += ` AND p.status = $${params.length + 1}`; params.push(status); }
    if (employee_id) { sql += ` AND p.employee_id = $${params.length + 1}`; params.push(employee_id); }
    if (period_start) { sql += ` AND p.period_start >= $${params.length + 1}`; params.push(period_start); }
    if (period_end) { sql += ` AND p.period_end <= $${params.length + 1}`; params.push(period_end); }

    sql += ' ORDER BY p.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get payroll list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/payroll', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { employee_id, period_start, period_end, gross_salary, deductions = 0, bonuses = 0, overtime_hours = 0, overtime_pay = 0, tax_amount = 0, status = 'pending', notes, items = [] } = req.body;

    const employeeResult = await client.query(
      'SELECT id FROM employees WHERE id = $1 AND business_id = $2',
      [employee_id, req.business_id]
    );
    if (employeeResult.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

    const net_salary = gross_salary + bonuses + overtime_pay - deductions - tax_amount;

    const payrollResult = await client.query(
      `INSERT INTO payroll (business_id, employee_id, period_start, period_end, gross_salary, deductions,
       bonuses, overtime_hours, overtime_pay, tax_amount, net_salary, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.business_id, employee_id, period_start, period_end, gross_salary, deductions,
       bonuses, overtime_hours, overtime_pay, tax_amount, net_salary, status, notes, req.user.id]
    );

    const payroll = payrollResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO payroll_items (payroll_id, business_id, description, amount, type)
         VALUES ($1, $2, $3, $4, $5)`,
        [payroll.id, req.business_id, item.description, item.amount, item.type]
      );
    }

    if (status === 'paid') {
      await client.query(
        `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
         VALUES ($1, 'outflow', $2, $3, $4, 'payroll', $5)`,
        [req.business_id, net_salary, period_end, `Payroll: ${period_start} to ${period_end}`, payroll.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(payroll);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create payroll error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/payroll/:id', async (req, res) => {
  try {
    const { status, pay_date } = req.body;

    const existing = await query(
      'SELECT * FROM payroll WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Payroll not found' });

    const payroll = existing.rows[0];
    const newStatus = status || payroll.status;
    const newPayDate = pay_date || payroll.pay_date;

    const result = await query(
      `UPDATE payroll SET status = $1, pay_date = $2 WHERE id = $3 AND business_id = $4 RETURNING *`,
      [newStatus, newPayDate, req.params.id, req.business_id]
    );

    if (newStatus === 'paid' && payroll.status !== 'paid') {
      await query(
        `INSERT INTO cashflow_entries (business_id, entry_type, amount, date, description, source_type, source_id)
         VALUES ($1, 'outflow', $2, $3, $4, 'payroll', $5)`,
        [req.business_id, payroll.net_salary, payroll.period_end, `Payroll payment`, req.params.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update payroll error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM employees WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {
      first_name, last_name, email, phone, position, department, hire_date,
      termination_date, status, salary, salary_type, bank_name, bank_account,
      id_number, address, emergency_contact_name, emergency_contact_phone, notes
    } = value;

    const result = await query(
      `INSERT INTO employees (business_id, first_name, last_name, email, phone, position, department,
       hire_date, termination_date, status, salary, salary_type, bank_name, bank_account, id_number,
       address, emergency_contact_name, emergency_contact_phone, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [req.business_id, first_name, last_name, email, phone, position, department, hire_date,
       termination_date, status, salary, salary_type, bank_name, bank_account, id_number,
       address, emergency_contact_name, emergency_contact_phone, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {
      first_name, last_name, email, phone, position, department, hire_date,
      termination_date, status, salary, salary_type, bank_name, bank_account,
      id_number, address, emergency_contact_name, emergency_contact_phone, notes
    } = value;

    const result = await query(
      `UPDATE employees SET first_name=$1, last_name=$2, email=$3, phone=$4, position=$5,
       department=$6, hire_date=$7, termination_date=$8, status=$9, salary=$10, salary_type=$11,
       bank_name=$12, bank_account=$13, id_number=$14, address=$15, emergency_contact_name=$16,
       emergency_contact_phone=$17, notes=$18, updated_at=NOW()
       WHERE id=$19 AND business_id=$20 RETURNING *`,
      [first_name, last_name, email, phone, position, department, hire_date, termination_date,
       status, salary, salary_type, bank_name, bank_account, id_number, address,
       emergency_contact_name, emergency_contact_phone, notes, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM employees WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/attendance', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let sql = 'SELECT * FROM attendance WHERE employee_id = $1 AND business_id = $2';
    const params = [req.params.id, req.business_id];

    if (start_date) { sql += ` AND date >= $${params.length + 1}`; params.push(start_date); }
    if (end_date) { sql += ` AND date <= $${params.length + 1}`; params.push(end_date); }

    sql += ' ORDER BY date DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/clock-in', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await query(
      'SELECT id FROM attendance WHERE employee_id = $1 AND date = $2 AND business_id = $3',
      [req.params.id, today, req.business_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    const result = await query(
      `INSERT INTO attendance (business_id, employee_id, date, clock_in, status)
       VALUES ($1, $2, $3, NOW(), 'present') RETURNING *`,
      [req.business_id, req.params.id, today]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Clock in error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/clock-out', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(
      `UPDATE attendance SET clock_out = NOW() WHERE employee_id = $1 AND date = $2 AND business_id = $3 RETURNING *`,
      [req.params.id, today, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No clock-in found for today' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Clock out error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/payroll', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM payroll WHERE employee_id = $1 AND business_id = $2 ORDER BY created_at DESC',
      [req.params.id, req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get payroll error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
