-- 002_unique_per_business.sql
-- Fix global UNIQUE constraints that should be per-business

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
ALTER TABLE invoices ADD UNIQUE (business_id, invoice_number);

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_invoice_number_key;
ALTER TABLE sales ADD UNIQUE (business_id, invoice_number);

ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_receipt_number_key;
ALTER TABLE receipts ADD UNIQUE (business_id, receipt_number);

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_po_number_key;
ALTER TABLE purchase_orders ADD UNIQUE (business_id, po_number);

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_ticket_number_key;
ALTER TABLE support_tickets ADD UNIQUE (business_id, ticket_number);

ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_token_key;
ALTER TABLE team_invitations ADD UNIQUE (business_id, token);
