-- 002_unique_per_business.sql
-- Fix global UNIQUE constraints that should be per-business

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_business_invoice_number ON invoices(business_id, invoice_number);

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_invoice_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_business_invoice_number ON sales(business_id, invoice_number);

ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_receipt_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_business_receipt_number ON receipts(business_id, receipt_number);

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_po_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_business_po_number ON purchase_orders(business_id, po_number);

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_ticket_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_business_ticket_number ON support_tickets(business_id, ticket_number);

ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_token_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_business_token ON team_invitations(business_id, token);
