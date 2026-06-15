-- 003_add_missing_columns.sql
-- Add columns that were referenced by code but missing from schema

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP;
