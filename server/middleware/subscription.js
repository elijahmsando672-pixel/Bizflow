import { query } from '../config/db.js';

// Routes that don't require an active subscription
const FREE_ROUTES = [
  '/api/auth',
  '/api/subscriptions',
  '/api/health',
  '/api/version',
  '/api/users',
];

export const requireSubscription = async (req, res, next) => {
  const path = req.originalUrl;
  if (FREE_ROUTES.some((route) => path.startsWith(route))) {
    return next();
  }

  try {
    const result = await query(
      `SELECT status, trial_ends_at, current_period_end
       FROM business_subscriptions
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.business_id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'No subscription found',
        code: 'SUBSCRIPTION_REQUIRED',
        redirect: '/subscription',
      });
    }

    const sub = result.rows[0];
    const now = new Date();

    if (sub.status === 'active') {
      return next();
    }

    if (sub.status === 'trial') {
      if (sub.trial_ends_at && new Date(sub.trial_ends_at) < now) {
        await query(
          `UPDATE business_subscriptions SET status = 'expired' WHERE business_id = $1 AND status = 'trial'`,
          [req.business_id]
        );
        return res.status(403).json({
          error: 'Your free trial has expired. Please choose a plan to continue.',
          code: 'TRIAL_EXPIRED',
          redirect: '/subscription',
        });
      }
      return next();
    }

    return res.status(403).json({
      error: `Your subscription is ${sub.status}. Please renew to continue using BizFlow.`,
      code: 'SUBSCRIPTION_INACTIVE',
      redirect: '/subscription',
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    next();
  }
};

export const seedDefaultPlans = async () => {
  try {
    const existing = await query('SELECT COUNT(*) as count FROM subscription_plans');
    if (parseInt(existing.rows[0].count) > 0) return;

    await query(
      `INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, max_users, max_products, features, is_active, trial_days)
       VALUES
       ('Free Trial', '7-day trial with full access to all features', 0, 'KES', 'monthly', 5, 50, '["Full feature access during trial"]', false, 7),
       ('Pro', 'Perfect for small businesses. Everything you need to get started.', 1500, 'KES', 'monthly', 10, 200, '["All core business modules", "Sales & invoicing", "Expense tracking", "Customer management", "Inventory management", "Basic reports", "Email support"]', true, 0),
       ('Max', 'For growing businesses that need advanced features and more capacity.', 3500, 'KES', 'monthly', 50, 1000, '["Everything in Pro", "CRM & pipeline", "Project management", "Time tracking", "Procurement", "Advanced reports & analytics", "AI-powered insights", "Priority support", "Multi-user access"]', true, 0)`
    );
    console.log('Default subscription plans seeded');
  } catch (error) {
    console.error('Error seeding plans:', error);
  }
};
