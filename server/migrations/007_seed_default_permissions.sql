-- 007_seed_default_permissions.sql
-- Backfills the permissions table for businesses created before the seeder ran
-- at registration (server/utils/permissions.js).
--
-- Two things were missing before this migration:
--   1. Ten resources added to the vocabulary (notifications, debtors, creditors,
--      timetracking, shops, reviews, messages, payments, webhooks, api_keys).
--   2. The `accountant` role, which was invitable but never seeded, so an
--      accountant was denied on every route. The old `viewer` role was the
--      mirror image: seeded, but no user could ever hold it.
--
-- ON CONFLICT DO NOTHING preserves any grant an admin has already tuned.
-- `viewer` rows are left in place; the role is no longer part of the vocabulary
-- and can never be assigned, so they are inert.

INSERT INTO permissions (business_id, role_name, resource, can_create, can_read, can_update, can_delete)
SELECT b.id, defaults.role_name, defaults.resource,
       defaults.can_create, defaults.can_read, defaults.can_update, defaults.can_delete
FROM businesses b
CROSS JOIN (VALUES
  -- owner / admin: full matrix. Both bypass the table in middleware/rbac.js;
  -- these rows only exist so the permissions screen is not a column of blanks.
  ('owner', 'customers', true, true, true, true),
  ('owner', 'products', true, true, true, true),
  ('owner', 'sales', true, true, true, true),
  ('owner', 'expenses', true, true, true, true),
  ('owner', 'invoices', true, true, true, true),
  ('owner', 'leads', true, true, true, true),
  ('owner', 'deals', true, true, true, true),
  ('owner', 'tickets', true, true, true, true),
  ('owner', 'projects', true, true, true, true),
  ('owner', 'vendors', true, true, true, true),
  ('owner', 'purchase_orders', true, true, true, true),
  ('owner', 'employees', true, true, true, true),
  ('owner', 'team', true, true, true, true),
  ('owner', 'users', true, true, true, true),
  ('owner', 'reports', true, true, true, true),
  ('owner', 'notifications', true, true, true, true),
  ('owner', 'debtors', true, true, true, true),
  ('owner', 'creditors', true, true, true, true),
  ('owner', 'timetracking', true, true, true, true),
  ('owner', 'shops', true, true, true, true),
  ('owner', 'reviews', true, true, true, true),
  ('owner', 'messages', true, true, true, true),
  ('owner', 'payments', true, true, true, true),
  ('owner', 'webhooks', true, true, true, true),
  ('owner', 'api_keys', true, true, true, true),
  ('admin', 'customers', true, true, true, true),
  ('admin', 'products', true, true, true, true),
  ('admin', 'sales', true, true, true, true),
  ('admin', 'expenses', true, true, true, true),
  ('admin', 'invoices', true, true, true, true),
  ('admin', 'leads', true, true, true, true),
  ('admin', 'deals', true, true, true, true),
  ('admin', 'tickets', true, true, true, true),
  ('admin', 'projects', true, true, true, true),
  ('admin', 'vendors', true, true, true, true),
  ('admin', 'purchase_orders', true, true, true, true),
  ('admin', 'employees', true, true, true, true),
  ('admin', 'team', true, true, true, true),
  ('admin', 'users', true, true, true, true),
  ('admin', 'reports', true, true, true, true),
  ('admin', 'notifications', true, true, true, true),
  ('admin', 'debtors', true, true, true, true),
  ('admin', 'creditors', true, true, true, true),
  ('admin', 'timetracking', true, true, true, true),
  ('admin', 'shops', true, true, true, true),
  ('admin', 'reviews', true, true, true, true),
  ('admin', 'messages', true, true, true, true),
  ('admin', 'payments', true, true, true, true),
  ('admin', 'webhooks', true, true, true, true),
  ('admin', 'api_keys', true, true, true, true),

  -- manager: edits the operational record, reads people, never touches accounts
  ('manager', 'customers', true, true, true, false),
  ('manager', 'products', true, true, true, false),
  ('manager', 'sales', true, true, true, false),
  ('manager', 'expenses', true, true, true, false),
  ('manager', 'invoices', true, true, true, false),
  ('manager', 'leads', true, true, true, false),
  ('manager', 'deals', true, true, true, false),
  ('manager', 'tickets', true, true, true, false),
  ('manager', 'projects', true, true, true, false),
  ('manager', 'vendors', true, true, true, false),
  ('manager', 'purchase_orders', true, true, true, false),
  ('manager', 'reports', true, true, true, false),
  ('manager', 'notifications', true, true, true, false),
  ('manager', 'debtors', true, true, true, false),
  ('manager', 'creditors', true, true, true, false),
  ('manager', 'timetracking', true, true, true, false),
  ('manager', 'shops', true, true, true, false),
  ('manager', 'reviews', true, true, true, false),
  ('manager', 'messages', true, true, true, false),
  ('manager', 'payments', true, true, true, false),
  ('manager', 'employees', false, true, false, false),
  ('manager', 'team', false, true, false, false),
  -- `users` is the account-management surface, not the staff directory that
  -- `team` exposes, so it stays shut for every delegable role.
  ('manager', 'users', false, false, false, false),
  ('manager', 'webhooks', false, false, false, false),
  ('manager', 'api_keys', false, false, false, false),

  -- staff: raises day-to-day records, cannot correct or delete them
  ('staff', 'customers', true, true, false, false),
  ('staff', 'products', true, true, false, false),
  ('staff', 'sales', true, true, false, false),
  ('staff', 'expenses', true, true, false, false),
  ('staff', 'invoices', true, true, false, false),
  ('staff', 'leads', true, true, false, false),
  ('staff', 'tickets', true, true, false, false),
  ('staff', 'projects', true, true, false, false),
  ('staff', 'debtors', true, true, false, false),
  ('staff', 'creditors', true, true, false, false),
  ('staff', 'timetracking', true, true, false, false),
  ('staff', 'messages', true, true, false, false),
  ('staff', 'payments', true, true, false, false),
  ('staff', 'deals', false, true, false, false),
  ('staff', 'vendors', false, true, false, false),
  ('staff', 'purchase_orders', false, true, false, false),
  ('staff', 'reports', false, true, false, false),
  ('staff', 'notifications', false, true, false, false),
  ('staff', 'shops', false, true, false, false),
  ('staff', 'reviews', false, true, false, false),
  ('staff', 'employees', false, true, false, false),
  ('staff', 'team', false, true, false, false),
  ('staff', 'users', false, false, false, false),
  ('staff', 'webhooks', false, false, false, false),
  ('staff', 'api_keys', false, false, false, false),

  -- accountant: edits the money-facing record, reads the rest
  ('accountant', 'customers', true, true, true, false),
  ('accountant', 'products', true, true, true, false),
  ('accountant', 'sales', true, true, true, false),
  ('accountant', 'expenses', true, true, true, false),
  ('accountant', 'invoices', true, true, true, false),
  ('accountant', 'debtors', true, true, true, false),
  ('accountant', 'creditors', true, true, true, false),
  ('accountant', 'payments', true, true, true, false),
  ('accountant', 'timetracking', true, true, true, false),
  ('accountant', 'reports', true, true, true, false),
  ('accountant', 'leads', false, true, false, false),
  ('accountant', 'deals', false, true, false, false),
  ('accountant', 'tickets', false, true, false, false),
  ('accountant', 'projects', false, true, false, false),
  ('accountant', 'vendors', false, true, false, false),
  ('accountant', 'purchase_orders', false, true, false, false),
  ('accountant', 'notifications', false, true, false, false),
  ('accountant', 'shops', false, true, false, false),
  ('accountant', 'reviews', false, true, false, false),
  ('accountant', 'messages', false, true, false, false),
  ('accountant', 'employees', false, true, false, false),
  ('accountant', 'team', false, true, false, false),
  ('accountant', 'users', false, false, false, false),
  ('accountant', 'webhooks', false, false, false, false),
  ('accountant', 'api_keys', false, false, false, false)
) AS defaults(role_name, resource, can_create, can_read, can_update, can_delete)
ON CONFLICT (business_id, role_name, resource) DO NOTHING;
