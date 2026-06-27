import { query, pool } from '../config/db.js';

export const getAgents = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM mpesa_agents WHERE business_id = $1 ORDER BY name',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get agents error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createAgent = async (req, res) => {
  try {
    const { name, phone, mpesa_number, commission_rate } = req.body;
    if (!name || !phone || !mpesa_number) {
      return res.status(400).json({ error: 'Name, phone, and M-Pesa number are required' });
    }
    const result = await query(
      `INSERT INTO mpesa_agents (business_id, name, phone, mpesa_number, commission_rate)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.business_id, name, phone, mpesa_number, commission_rate || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create agent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateAgent = async (req, res) => {
  try {
    const { name, phone, mpesa_number, commission_rate, is_active } = req.body;
    const result = await query(
      `UPDATE mpesa_agents SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       mpesa_number = COALESCE($3, mpesa_number), commission_rate = COALESCE($4, commission_rate),
       is_active = COALESCE($5, is_active)
       WHERE id = $6 AND business_id = $7 RETURNING *`,
      [name, phone, mpesa_number, commission_rate, is_active, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update agent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM mpesa_agents WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json({ message: 'Agent deleted' });
  } catch (err) {
    console.error('Delete agent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { status, search, start_date, end_date } = req.query;
    let sql = `SELECT * FROM cashflow_entries WHERE business_id = $1 AND payment_method = 'mpesa'`;
    const params = [req.business_id];
    let idx = 2;
    if (status && status !== 'ALL') {
      sql += ` AND entry_type = $${idx}`; params.push(status); idx++;
    }
    if (start_date) {
      sql += ` AND date >= $${idx}`; params.push(start_date); idx++;
    }
    if (end_date) {
      sql += ` AND date <= $${idx}`; params.push(end_date); idx++;
    }
    if (search) {
      sql += ` AND (description ILIKE $${idx} OR reference ILIKE $${idx} OR category ILIKE $${idx})`;
      params.push(`%${search}%`);
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const result = await query(sql, params);
    const totalIn = result.rows.filter(r => r.entry_type === 'inflow').reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalOut = result.rows.filter(r => r.entry_type === 'outflow').reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    res.json({ transactions: result.rows, total_inflow: totalIn, total_outflow: totalOut, net: totalIn - totalOut });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { period } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const result = await query(
      `SELECT DATE(date) as day, entry_type, SUM(amount) as total FROM cashflow_entries
       WHERE business_id = $1 AND payment_method = 'mpesa' AND date >= CURRENT_DATE - $2
       GROUP BY day, entry_type ORDER BY day`,
      [req.business_id, days]
    );
    const summary = await query(
      `SELECT entry_type, COUNT(*) as count, SUM(amount) as total FROM cashflow_entries
       WHERE business_id = $1 AND payment_method = 'mpesa' AND date >= CURRENT_DATE - $2
       GROUP BY entry_type`,
      [req.business_id, days]
    );
    const topCategories = await query(
      `SELECT category, SUM(amount) as total FROM cashflow_entries
       WHERE business_id = $1 AND payment_method = 'mpesa' AND category IS NOT NULL AND category != ''
       GROUP BY category ORDER BY total DESC LIMIT 10`,
      [req.business_id]
    );
    res.json({ daily: result.rows, summary: summary.rows, top_categories: topCategories.rows });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
