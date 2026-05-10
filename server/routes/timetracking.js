import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { user_id, project_id, task_id, customer_id, description, date, start_time, end_time, duration_minutes, is_billable } = req.body;
    const result = await query(
      `INSERT INTO time_entries (business_id, user_id, project_id, task_id, customer_id, description, date, start_time, end_time, duration_minutes, is_billable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.business_id, user_id || req.user.id, project_id, task_id, customer_id, description, date || new Date().toISOString().split('T')[0], start_time, end_time, duration_minutes, is_billable !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { user_id, project_id, date_from, date_to, is_billable } = req.query;
    let conditions = ['t.business_id = $1'];
    const params = [req.business_id];
    let idx = 2;

    if (user_id) { conditions.push(`t.user_id = $${idx}`); params.push(user_id); idx++; }
    if (project_id) { conditions.push(`t.project_id = $${idx}`); params.push(project_id); idx++; }
    if (date_from) { conditions.push(`t.date >= $${idx}`); params.push(date_from); idx++; }
    if (date_to) { conditions.push(`t.date <= $${idx}`); params.push(date_to); idx++; }
    if (is_billable !== undefined) { conditions.push(`t.is_billable = $${idx}`); params.push(is_billable === 'true'); idx++; }

    const result = await query(
      `SELECT t.*, u.name as user_name, p.name as project_name, pt.title as task_title, c.name as customer_name
       FROM time_entries t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN project_tasks pt ON t.task_id = pt.id
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.date DESC, t.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let conditions = ['t.business_id = $1'];
    const params = [req.business_id];
    let idx = 2;
    if (date_from) { conditions.push(`t.date >= $${idx}`); params.push(date_from); idx++; }
    if (date_to) { conditions.push(`t.date <= $${idx}`); params.push(date_to); idx++; }

    const summary = await query(
      `SELECT 
         COUNT(*) as total_entries,
         COALESCE(SUM(t.duration_minutes), 0) / 60.0 as total_hours,
         COALESCE(SUM(t.duration_minutes) FILTER (WHERE t.is_billable = true), 0) / 60.0 as billable_hours,
         COALESCE(SUM(t.duration_minutes) FILTER (WHERE t.is_billable = false), 0) / 60.0 as non_billable_hours,
         COALESCE(SUM(t.billed_amount), 0) as total_billed
       FROM time_entries t WHERE ${conditions.join(' AND ')}`,
      params
    );

    const byProject = await query(
      `SELECT p.name as project_name, COALESCE(SUM(t.duration_minutes), 0) / 60.0 as hours, COUNT(*) as entries
       FROM time_entries t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY p.name
       ORDER BY hours DESC`,
      params
    );

    const byUser = await query(
      `SELECT u.name, COALESCE(SUM(t.duration_minutes), 0) / 60.0 as hours, COUNT(*) as entries
       FROM time_entries t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY u.name
       ORDER BY hours DESC`,
      params
    );

    res.json({ summary: summary.rows[0], by_project: byProject.rows, by_user: byUser.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { description, duration_minutes, is_billable, billed_amount, start_time, end_time } = req.body;
    const result = await query(
      `UPDATE time_entries SET description=COALESCE($2,description), duration_minutes=COALESCE($3,duration_minutes),
       is_billable=COALESCE($4,is_billable), billed_amount=COALESCE($5,billed_amount),
       start_time=COALESCE($6,start_time), end_time=COALESCE($7,end_time)
       WHERE id=$1 AND business_id=$8 RETURNING *`,
      [req.params.id, description, duration_minutes, is_billable, billed_amount, start_time, end_time, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Time entry not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM time_entries WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Time entry not found' });
    res.json({ message: 'Time entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

export default router;
