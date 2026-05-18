import express from 'express';
import { query, pool } from '../config/db.js';

const router = express.Router();

router.get('/plans', async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/current', async (req, res) => {
  try {
    const result = await query(
      `SELECT bs.*, sp.name as plan_name, sp.price as plan_price, sp.features
       FROM business_subscriptions bs
       LEFT JOIN subscription_plans sp ON bs.plan_id = sp.id
       WHERE bs.business_id = $1`,
      [req.business_id]
    );

    if (result.rows.length === 0) {
      return res.json({ status: 'no_subscription', trial_active: true });
    }

    const sub = result.rows[0];
    const now = new Date();

    if (sub.status === 'trial' && sub.trial_ends_at && new Date(sub.trial_ends_at) < now) {
      await query(
        "UPDATE business_subscriptions SET status = 'expired' WHERE id = $1",
        [sub.id]
      );
      sub.status = 'expired';
    }

    if (sub.current_period_end && new Date(sub.current_period_end) < now && sub.status === 'active') {
      await query(
        "UPDATE business_subscriptions SET status = 'expired' WHERE id = $1",
        [sub.id]
      );
      sub.status = 'expired';
    }

    res.json(sub);
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/activate', async (req, res) => {
  try {
    const { plan_id } = req.body;
    const planResult = await query('SELECT * FROM subscription_plans WHERE id = $1', [plan_id]);
    if (planResult.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });

    const plan = planResult.rows[0];
    const now = new Date();
    const periodEnd = new Date(now);

    if (plan.billing_cycle === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
    else if (plan.billing_cycle === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setDate(periodEnd.getDate() + 7);

    const result = await query(
      `INSERT INTO business_subscriptions (business_id, plan_id, status, start_date, current_period_start, current_period_end, next_billing_date, amount)
       VALUES ($1, $2, 'active', $3, $4, $5, $6, $7) RETURNING *`,
      [req.business_id, plan_id, now, now, periodEnd, periodEnd, plan.price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Activate subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/cancel', async (req, res) => {
  try {
    const result = await query(
      `UPDATE business_subscriptions SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1
       WHERE business_id = $2 RETURNING *`,
      [req.user.id, req.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No subscription found' });
    res.json({ message: 'Subscription cancelled', subscription: result.rows[0] });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const result = await query(
      `SELECT ph.*, bs.plan_id
       FROM payment_history ph
       LEFT JOIN business_subscriptions bs ON ph.subscription_id = bs.id
       WHERE ph.business_id = $1
       ORDER BY ph.created_at DESC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/payments/record', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { subscription_id, amount, payment_method, transaction_id, status = 'completed' } = req.body;

    const subResult = await client.query(
      'SELECT * FROM business_subscriptions WHERE id = $1 AND business_id = $2',
      [subscription_id, req.business_id]
    );
    if (subResult.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });

    const paymentResult = await client.query(
      `INSERT INTO payment_history (business_id, subscription_id, amount, status, payment_method, transaction_id, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [req.business_id, subscription_id, amount, status, payment_method, transaction_id]
    );

    const sub = subResult.rows[0];
    const now = new Date();
    const nextBilling = new Date(sub.current_period_end || now);
    if (sub.plan_id) {
      const planResult = await client.query('SELECT billing_cycle FROM subscription_plans WHERE id = $1', [sub.plan_id]);
      const cycle = planResult.rows[0]?.billing_cycle || 'monthly';
      if (cycle === 'monthly') nextBilling.setMonth(nextBilling.getMonth() + 1);
      else if (cycle === 'yearly') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      else nextBilling.setDate(nextBilling.getDate() + 7);
    }

    await client.query(
      `UPDATE business_subscriptions SET status = 'active', last_payment_date = $1, next_billing_date = $2, current_period_end = $3
       WHERE id = $4`,
      [now, nextBilling, nextBilling, subscription_id]
    );

    await client.query('COMMIT');
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Record payment error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/check-usage', async (req, res) => {
  try {
    const subResult = await query(
      `SELECT bs.*, sp.max_users, sp.max_products
       FROM business_subscriptions bs
       LEFT JOIN subscription_plans sp ON bs.plan_id = sp.id
       WHERE bs.business_id = $1 AND bs.status = 'active'`,
      [req.business_id]
    );

    if (subResult.rows.length === 0) {
      return res.json({ within_limits: true, using_trial: true });
    }

    const sub = subResult.rows[0];
    const userCount = await query('SELECT COUNT(*) FROM users WHERE business_id = $1', [req.business_id]);
    const productCount = await query('SELECT COUNT(*) FROM products WHERE business_id = $1', [req.business_id]);

    const currentUsers = parseInt(userCount.rows[0].count);
    const currentProducts = parseInt(productCount.rows[0].count);
    const withinLimits =
      (!sub.max_users || currentUsers <= sub.max_users) &&
      (!sub.max_products || currentProducts <= sub.max_products);

    res.json({
      within_limits: withinLimits,
      max_users: sub.max_users,
      current_users: currentUsers,
      max_products: sub.max_products,
      current_products: currentProducts,
    });
  } catch (err) {
    console.error('Check usage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
