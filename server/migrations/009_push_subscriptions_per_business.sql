-- 009_push_subscriptions_per_business.sql
-- Push endpoints were globally UNIQUE, which made one business's browser endpoint
-- collide with another's. Two consequences, both cross-tenant:
--
--   * POST /api/push/unsubscribe deleted by endpoint alone, so any authenticated
--     member who knew another tenant's endpoint could remove that tenant's
--     subscription and silently stop its notifications.
--   * POST /api/push/subscribe conflicted on that global key and overwrote the
--     existing row's key material, leaving the victim's business_id in place while
--     replacing the keys — their pushes then failed at the push service.
--
-- An endpoint identifies a browser, not a tenant, so uniqueness belongs to the
-- pair. Same shape as 002_unique_per_business.sql.

ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_endpoint_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_business_endpoint
  ON push_subscriptions(business_id, endpoint);