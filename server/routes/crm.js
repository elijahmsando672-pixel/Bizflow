import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, company, job_title, source, estimated_value, notes } = req.body;
    const businessId = req.business_id;
    const createdById = req.user_id;

    const result = await query(
      `INSERT INTO leads (business_id, first_name, last_name, email, phone, company, job_title, source, estimated_value, notes, created_by, lead_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
         CASE WHEN $8 = 'referral' THEN 80 WHEN $8 = 'inbound' THEN 70 WHEN $8 = 'outbound' THEN 50 ELSE 30 END)
       RETURNING *`,
      [businessId, first_name, last_name, email, phone, company, job_title, source, estimated_value || 0, notes, createdById]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, source, assigned_to } = req.query;
    const businessId = req.business_id;
    let conditions = ['business_id = $1'];
    const params = [businessId];
    let idx = 2;

    if (status) { conditions.push(`status = $${idx}`); params.push(status); idx++; }
    if (source) { conditions.push(`source = $${idx}`); params.push(source); idx++; }
    if (assigned_to) { conditions.push(`assigned_to = $${idx}`); params.push(assigned_to); idx++; }

    const result = await query(
      `SELECT l.*, u.first_name || ' ' || u.last_name as assigned_name, c.first_name || ' ' || c.last_name as created_name
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       LEFT JOIN users c ON l.created_by = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY l.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT l.*, u.first_name || ' ' || u.last_name as assigned_name
       FROM leads l LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.id = $1 AND l.business_id = $2`,
      [req.params.id, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, company, job_title, source, status, lead_score, estimated_value, assigned_to, notes } = req.body;
    const result = await query(
      `UPDATE leads SET first_name=COALESCE($2,first_name), last_name=COALESCE($3,last_name), email=COALESCE($4,email),
       phone=COALESCE($5,phone), company=COALESCE($6,company), job_title=COALESCE($7,job_title), source=COALESCE($8,source),
       status=COALESCE($9,status), lead_score=COALESCE($10,lead_score), estimated_value=COALESCE($11,estimated_value),
       assigned_to=COALESCE($12,assigned_to), notes=COALESCE($13,notes), updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND business_id=$14 RETURNING *`,
      [req.params.id, first_name, last_name, email, phone, company, job_title, source, status, lead_score, estimated_value, assigned_to, notes, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

router.post('/:id/convert', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, company } = req.body;
    const businessId = req.business_id;

    const lead = await query(`SELECT * FROM leads WHERE id = $1 AND business_id = $2`, [req.params.id, businessId]);
    if (!lead.rows.length) return res.status(404).json({ error: 'Lead not found' });

    const l = lead.rows[0];
    const customerResult = await query(
      `INSERT INTO customers (business_id, first_name, last_name, email, phone, company)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [businessId, l.first_name, l.last_name, customer_email || l.email, customer_phone || l.phone, company || l.company]
    );

    const customerId = customerResult.rows[0].id;

    await query(`UPDATE leads SET converted_customer_id = $1, status = 'converted' WHERE id = $2`, [customerId, req.params.id]);

    await query(
      `INSERT INTO customer_activities (business_id, customer_id, activity_type, subject, created_by)
       VALUES ($1, $2, 'conversion', 'Converted from lead: $3', $4)`,
      [businessId, customerId, l.first_name + ' ' + l.last_name, req.user_id]
    );

    res.json({ message: 'Lead converted to customer', customer_id: customerId });
  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

router.post('/:id/activities', async (req, res) => {
  try {
    const { activity_type, subject, description, scheduled_at } = req.body;
    const result = await query(
      `INSERT INTO customer_activities (business_id, customer_id, activity_type, subject, description, scheduled_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.business_id, req.params.id, activity_type, subject, description, scheduled_at, req.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM leads WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
