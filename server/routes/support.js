import express from 'express';
import { query } from '../config/db.js';
import { sendTicketCreatedEmail, sendTicketReplyEmail } from '../utils/email.js';

const router = express.Router();

async function getNextTicketNumber() {
  const result = await query(`SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1 as next_num FROM support_tickets`);
  return `TKT-${String(result.rows[0].next_num).padStart(5, '0')}`;
}

// SLA Configs (before /:id)
router.get('/sla-configs', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM sla_configs WHERE business_id = $1 ORDER BY category, priority`,
      [req.business_id]
    );
    if (!result.rows.length) {
      const defaults = [
        { category: 'billing', priority: 'critical', response_hours: 2, resolution_hours: 8 },
        { category: 'billing', priority: 'high', response_hours: 4, resolution_hours: 24 },
        { category: 'billing', priority: 'medium', response_hours: 8, resolution_hours: 48 },
        { category: 'billing', priority: 'low', response_hours: 24, resolution_hours: 72 },
        { category: 'technical', priority: 'critical', response_hours: 1, resolution_hours: 4 },
        { category: 'technical', priority: 'high', response_hours: 2, resolution_hours: 12 },
        { category: 'technical', priority: 'medium', response_hours: 6, resolution_hours: 36 },
        { category: 'technical', priority: 'low', response_hours: 12, resolution_hours: 72 },
        { category: 'general', priority: 'critical', response_hours: 4, resolution_hours: 12 },
        { category: 'general', priority: 'high', response_hours: 8, resolution_hours: 24 },
        { category: 'general', priority: 'medium', response_hours: 12, resolution_hours: 48 },
        { category: 'general', priority: 'low', response_hours: 24, resolution_hours: 96 },
      ];
      const results = await Promise.all(
        defaults.map(d => query(
          `INSERT INTO sla_configs (business_id, category, priority, response_hours, resolution_hours) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [req.business_id, d.category, d.priority, d.response_hours, d.resolution_hours]
        ))
      );
      return res.json(results.map(r => r.rows[0]));
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SLA configs' });
  }
});

router.put('/sla-configs/:id', async (req, res) => {
  try {
    const { response_hours, resolution_hours } = req.body;
    const result = await query(
      `UPDATE sla_configs SET response_hours=$2, resolution_hours=$3 WHERE id=$1 AND business_id=$4 RETURNING *`,
      [req.params.id, response_hours, resolution_hours, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'SLA config not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SLA config' });
  }
});

// Dashboard stats (before /:id)
router.get('/dashboard-stats', async (req, res) => {
  try {
    const stats = await query(
      `SELECT 
         COUNT(*) as total_tickets,
         COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
         COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
         COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets,
         COUNT(*) FILTER (WHERE sla_deadline < NOW() AND status IN ('open','in_progress')) as breached_tickets,
         COUNT(*) FILTER (WHERE priority = 'critical') as critical_tickets
       FROM support_tickets WHERE business_id = $1`,
      [req.business_id]
    );

    const recent = await query(
      `SELECT t.ticket_number, t.subject, t.status, t.priority, t.created_at,
              c.name as customer_name
       FROM support_tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.business_id = $1
       ORDER BY t.created_at DESC LIMIT 10`,
      [req.business_id]
    );

    res.json({ stats: stats.rows[0], recent: recent.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket stats' });
  }
});

// Tickets
router.post('/', async (req, res) => {
  try {
    const { customer_id, subject, description, priority, category, assigned_to } = req.body;
    const ticketNumber = await getNextTicketNumber();

    const slaResult = await query(
      `SELECT resolution_hours FROM sla_configs WHERE business_id = $1 AND category = $2 AND priority = $3 AND is_active = true LIMIT 1`,
      [req.business_id, category || 'general', priority || 'medium']
    );

    const slaHours = slaResult.rows.length ? slaResult.rows[0].resolution_hours : 48;
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + slaHours);

    const result = await query(
      `INSERT INTO support_tickets (business_id, customer_id, ticket_number, subject, description, priority, category, assigned_to, sla_deadline, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.business_id, customer_id, ticketNumber, subject, description, priority, category, assigned_to, slaDeadline.toISOString(), req.user.id]
    );
    const ticket = result.rows[0];

    if (assigned_to) {
      const assigneeResult = await query(`SELECT email, name FROM users WHERE id = $1`, [assigned_to]);
      if (assigneeResult.rows.length) {
        sendTicketCreatedEmail(assigneeResult.rows[0].email, ticket, { name: req.user.name }).catch(() => {});
      }
    }

    if (customer_id) {
      const custResult = await query(`SELECT email FROM customers WHERE id = $1`, [customer_id]);
      if (custResult.rows.length && custResult.rows[0].email) {
        sendTicketCreatedEmail(custResult.rows[0].email, ticket, null).catch(() => {});
      }
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, priority, category, assigned_to } = req.query;
    let conditions = ['t.business_id = $1'];
    const params = [req.business_id];
    let idx = 2;

    if (status) { conditions.push(`t.status = $${idx}`); params.push(status); idx++; }
    if (priority) { conditions.push(`t.priority = $${idx}`); params.push(priority); idx++; }
    if (category) { conditions.push(`t.category = $${idx}`); params.push(category); idx++; }
    if (assigned_to) { conditions.push(`t.assigned_to = $${idx}`); params.push(assigned_to); idx++; }

    const result = await query(
      `SELECT t.*, c.name as customer_name,
              u.name as assigned_name,
              CASE WHEN t.sla_deadline < NOW() AND t.status IN ('open','in_progress') THEN true ELSE false END as sla_breached
       FROM support_tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY 
         CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
         t.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, c.name as customer_name,
              u.name as assigned_name,
              CASE WHEN t.sla_deadline < NOW() AND t.status IN ('open','in_progress') THEN true ELSE false END as sla_breached
       FROM support_tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1 AND t.business_id = $2`,
      [req.params.id, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { subject, description, status, priority, category, assigned_to, resolution_notes } = req.body;
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const params = [req.params.id, req.business_id];
    let idx = 3;

    if (subject) { updates.push(`subject=$${idx}`); params.push(subject); idx++; }
    if (description) { updates.push(`description=$${idx}`); params.push(description); idx++; }
    if (status) { updates.push(`status=$${idx}`); params.push(status); idx++; }
    if (priority) { updates.push(`priority=$${idx}`); params.push(priority); idx++; }
    if (category) { updates.push(`category=$${idx}`); params.push(category); idx++; }
    if (assigned_to) { updates.push(`assigned_to=$${idx}`); params.push(assigned_to); idx++; }
    if (resolution_notes) { updates.push(`resolution_notes=$${idx}`); params.push(resolution_notes); idx++; }

    if (status === 'resolved') { updates.push(`resolved_at=CURRENT_TIMESTAMP`); }
    if (status === 'closed') { updates.push(`closed_at=CURRENT_TIMESTAMP`); }

    const result = await query(
      `UPDATE support_tickets SET ${updates.join(', ')} WHERE id=$1 AND business_id=$2 RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Ticket Replies
router.post('/:id/replies', async (req, res) => {
  try {
    const { message, is_internal } = req.body;
    const result = await query(
      `INSERT INTO ticket_replies (business_id, ticket_id, message, is_internal, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.business_id, req.params.id, message, is_internal || false, req.user.id]
    );
    const reply = result.rows[0];

    await query(`UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [req.params.id]);

    if (!is_internal) {
      const ticketResult = await query(
        `SELECT t.*, c.email as customer_email FROM support_tickets t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.id = $1`,
        [req.params.id]
      );
      if (ticketResult.rows.length) {
        const ticket = ticketResult.rows[0];
        if (ticket.customer_email && ticket.assigned_to !== req.user.id) {
          sendTicketReplyEmail(ticket.customer_email, ticket, reply, req.user.name).catch(() => {});
        }
      }
    }

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

router.get('/:id/replies', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.name as author_name
       FROM ticket_replies r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.ticket_id = $1
       ORDER BY r.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM ticket_replies WHERE ticket_id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    const result = await query(`DELETE FROM support_tickets WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
