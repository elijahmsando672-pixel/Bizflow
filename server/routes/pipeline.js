import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

// Deal Stages
router.get('/stages', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM deal_stages WHERE business_id = $1 ORDER BY order_index`,
      [req.business_id]
    );
    if (!result.rows.length) {
      const stages = [
        { name: 'Qualification', order_index: 0, win_probability: 10, color: '#6b7280' },
        { name: 'Proposal', order_index: 1, win_probability: 30, color: '#f59e0b' },
        { name: 'Negotiation', order_index: 2, win_probability: 60, color: '#3b82f6' },
        { name: 'Closed Won', order_index: 3, win_probability: 100, color: '#10b981' },
        { name: 'Closed Lost', order_index: 4, win_probability: 0, color: '#ef4444' },
      ];
      const results = await Promise.all(
        stages.map(s => query(
          `INSERT INTO deal_stages (business_id, name, order_index, win_probability, color) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [req.business_id, s.name, s.order_index, s.win_probability, s.color]
        ))
      );
      return res.json(results.map(r => r.rows[0]));
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal stages' });
  }
});

router.post('/stages', async (req, res) => {
  try {
    const { name, order_index, win_probability, color } = req.body;
    const result = await query(
      `INSERT INTO deal_stages (business_id, name, order_index, win_probability, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.business_id, name, order_index, win_probability, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stage' });
  }
});

router.put('/stages/:id', async (req, res) => {
  try {
    const { name, order_index, win_probability, color } = req.body;
    const result = await query(
      `UPDATE deal_stages SET name=COALESCE($2,name), order_index=COALESCE($3,order_index),
       win_probability=COALESCE($4,win_probability), color=COALESCE($5,color)
       WHERE id=$1 AND business_id=$6 RETURNING *`,
      [req.params.id, name, order_index, win_probability, color, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Stage not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

router.delete('/stages/:id', async (req, res) => {
  try {
    await query(`DELETE FROM deals WHERE stage_id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    const result = await query(`DELETE FROM deal_stages WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Stage not found' });
    res.json({ message: 'Stage deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete stage' });
  }
});

// Deals
router.post('/', async (req, res) => {
  try {
    const { customer_id, lead_id, name, stage_id, value, priority, expected_close_date, assigned_to, notes } = req.body;
    const result = await query(
      `INSERT INTO deals (business_id, customer_id, lead_id, name, stage_id, value, priority, expected_close_date, assigned_to, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.business_id, customer_id, lead_id, name, stage_id, value, priority, expected_close_date, assigned_to, notes, req.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { stage_id } = req.query;
    let conditions = ['d.business_id = $1'];
    const params = [req.business_id];
    let idx = 2;

    if (stage_id) { conditions.push(`d.stage_id = $${idx}`); params.push(stage_id); idx++; }

    const result = await query(
      `SELECT d.*, ds.name as stage_name, ds.win_probability, ds.color as stage_color,
              c.name as customer_name,
              u.name as assigned_name
       FROM deals d
       LEFT JOIN deal_stages ds ON d.stage_id = ds.id
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN users u ON d.assigned_to = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY d.expected_close_date ASC, d.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Pipeline summary (for dashboard) - must be before /:id
router.get('/pipeline-summary', async (req, res) => {
  try {
    const stages = await query(
      `SELECT ds.id, ds.name, ds.color, ds.win_probability,
              COUNT(d.id) as deal_count,
              COALESCE(SUM(d.value), 0) as total_value,
              COALESCE(SUM(d.value * ds.win_probability / 100), 0) as weighted_value
       FROM deal_stages ds
       LEFT JOIN deals d ON ds.id = d.stage_id AND d.outcome IS NULL
       WHERE ds.business_id = $1
       GROUP BY ds.id
       ORDER BY ds.order_index`,
      [req.business_id]
    );

    const summary = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE outcome = 'won') as won_deals,
         COALESCE(SUM(value) FILTER (WHERE outcome = 'won'), 0) as won_value,
         COUNT(*) FILTER (WHERE outcome = 'lost') as lost_deals,
         COALESCE(SUM(value) FILTER (WHERE outcome = 'lost'), 0) as lost_value
       FROM deals WHERE business_id = $1 AND outcome IS NOT NULL`,
      [req.business_id]
    );

    res.json({ stages: stages.rows, summary: summary.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pipeline summary' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, ds.name as stage_name, ds.win_probability, ds.color as stage_color,
              c.name as customer_name,
              u.name as assigned_name
       FROM deals d
       LEFT JOIN deal_stages ds ON d.stage_id = ds.id
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN users u ON d.assigned_to = u.id
       WHERE d.id = $1 AND d.business_id = $2`,
      [req.params.id, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Deal not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, stage_id, value, priority, expected_close_date, assigned_to, notes, outcome, loss_reason } = req.body;
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const params = [req.params.id, req.business_id];
    let idx = 3;

    if (name) { updates.push(`name=$${idx}`); params.push(name); idx++; }
    if (stage_id) { updates.push(`stage_id=$${idx}`); params.push(stage_id); idx++; }
    if (value !== undefined) { updates.push(`value=$${idx}`); params.push(value); idx++; }
    if (priority) { updates.push(`priority=$${idx}`); params.push(priority); idx++; }
    if (expected_close_date) { updates.push(`expected_close_date=$${idx}`); params.push(expected_close_date); idx++; }
    if (assigned_to) { updates.push(`assigned_to=$${idx}`); params.push(assigned_to); idx++; }
    if (notes) { updates.push(`notes=$${idx}`); params.push(notes); idx++; }
    if (outcome) { updates.push(`outcome=$${idx}`); params.push(outcome); idx++; }
    if (loss_reason) { updates.push(`loss_reason=$${idx}`); params.push(loss_reason); idx++; }

    if (outcome === 'won') { updates.push(`actual_close_date=CURRENT_DATE`); }
    if (outcome === 'lost') { updates.push(`actual_close_date=CURRENT_DATE`); }

    const result = await query(
      `UPDATE deals SET ${updates.join(', ')} WHERE id=$1 AND business_id=$2 RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Deal not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

router.post('/:id/activities', async (req, res) => {
  try {
    const { activity_type, description } = req.body;
    const result = await query(
      `INSERT INTO deal_activities (business_id, deal_id, activity_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.business_id, req.params.id, activity_type, description, req.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM deal_activities WHERE deal_id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    const result = await query(`DELETE FROM deals WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Deal not found' });
    res.json({ message: 'Deal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

export default router;
