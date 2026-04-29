import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, description, start_date, end_date, budget, customer_id, assigned_to } = req.body;
    const result = await query(
      `INSERT INTO projects (business_id, name, description, start_date, end_date, budget, customer_id, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.business_id, name, description, start_date, end_date, budget, customer_id, assigned_to, req.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let conditions = ['p.business_id = $1'];
    const params = [req.business_id];
    let idx = 2;
    if (status) { conditions.push(`p.status = $${idx}`); params.push(status); idx++; }

    const result = await query(
      `SELECT p.*, c.name as customer_name,
              u.name as assigned_name,
              COUNT(pt.id) FILTER (WHERE pt.status = 'todo') as tasks_todo,
              COUNT(pt.id) FILTER (WHERE pt.status = 'in_progress') as tasks_in_progress,
              COUNT(pt.id) FILTER (WHERE pt.status = 'completed') as tasks_done,
              COALESCE(SUM(te.duration_minutes), 0) / 60.0 as total_hours
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON p.assigned_to = u.id
       LEFT JOIN project_tasks pt ON p.id = pt.project_id
       LEFT JOIN time_entries te ON p.id = te.project_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY p.id, c.name, u.name
       ORDER BY p.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as customer_name,
              u.name as assigned_name
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON p.assigned_to = u.id
       WHERE p.id = $1 AND p.business_id = $2`,
      [req.params.id, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, status, start_date, end_date, budget, assigned_to } = req.body;
    const result = await query(
      `UPDATE projects SET name=COALESCE($2,name), description=COALESCE($3,description), status=COALESCE($4,status),
       start_date=COALESCE($5,start_date), end_date=COALESCE($6,end_date), budget=COALESCE($7,budget),
       assigned_to=COALESCE($8,assigned_to), updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND business_id=$9 RETURNING *`,
      [req.params.id, name, description, status, start_date, end_date, budget, assigned_to, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Project Tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const result = await query(
      `SELECT pt.*, u.name as assignee_name
       FROM project_tasks pt
       LEFT JOIN users u ON pt.assignee_id = u.id
       WHERE pt.project_id = $1 AND pt.business_id = $2
       ORDER BY 
         CASE pt.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
         pt.due_date ASC`,
      [req.params.id, req.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/:id/tasks', async (req, res) => {
  try {
    const { title, description, status, priority, assignee_id, due_date, estimated_hours } = req.body;
    const result = await query(
      `INSERT INTO project_tasks (business_id, project_id, title, description, status, priority, assignee_id, due_date, estimated_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.business_id, req.params.id, title, description, status || 'todo', priority, assignee_id, due_date, estimated_hours]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { title, description, status, priority, assignee_id, due_date, estimated_hours, actual_hours } = req.body;
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const params = [req.params.taskId, req.business_id];
    let idx = 3;

    if (title) { updates.push(`title=$${idx}`); params.push(title); idx++; }
    if (description) { updates.push(`description=$${idx}`); params.push(description); idx++; }
    if (status) { updates.push(`status=$${idx}`); params.push(status); idx++; }
    if (priority) { updates.push(`priority=$${idx}`); params.push(priority); idx++; }
    if (assignee_id) { updates.push(`assignee_id=$${idx}`); params.push(assignee_id); idx++; }
    if (due_date) { updates.push(`due_date=$${idx}`); params.push(due_date); idx++; }
    if (estimated_hours !== undefined) { updates.push(`estimated_hours=$${idx}`); params.push(estimated_hours); idx++; }
    if (actual_hours !== undefined) { updates.push(`actual_hours=$${idx}`); params.push(actual_hours); idx++; }
    if (status === 'completed') { updates.push(`completed_at=CURRENT_TIMESTAMP`); }

    const result = await query(
      `UPDATE project_tasks SET ${updates.join(', ')} WHERE id=$1 AND business_id=$2 RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM project_tasks WHERE project_id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    const result = await query(`DELETE FROM projects WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
