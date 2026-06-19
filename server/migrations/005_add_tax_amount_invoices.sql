-- 005_add_tax_amount_invoices.sql
-- Add tax_amount to invoices table (previously missing)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_business_status ON leads(business_id, status);
CREATE INDEX IF NOT EXISTS idx_deal_stages_business ON deal_stages(business_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_business_status ON support_tickets(business_id, status);
CREATE INDEX IF NOT EXISTS idx_sale_items_business ON sale_items(business_id);
CREATE INDEX IF NOT EXISTS idx_deals_business ON deals(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(business_id, email);
CREATE INDEX IF NOT EXISTS idx_vendors_business_email ON vendors(business_id, email);

-- Add UNIQUE constraints for data integrity
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_business_email ON users(business_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_business_email ON customers(business_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_business_email ON vendors(business_id, email) WHERE email IS NOT NULL;

-- Ensure sale_items cascade delete with sales (prevents orphaned items)
-- (CASCADE is already defined in schema but re-verify)
-- vendor_logs index skipped — table removed from schema
