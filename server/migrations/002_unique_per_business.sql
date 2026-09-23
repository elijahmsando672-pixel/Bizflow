-- 002_unique_per_business.sql
-- Postgres: converts global UNIQUE constraints to per-business UNIQUE(business_id, x).
-- For SQL Server this is applied directly in config/schema.tsql.js, where these
-- tables are created with UNIQUE(business_id, <number/token>) table constraints.
-- Recorded here to keep the migrations ledger consistent. No SQL needed.
SELECT 1;