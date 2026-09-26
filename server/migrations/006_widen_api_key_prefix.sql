-- 006_widen_api_key_prefix.sql
-- Generated key prefixes are "bf_" plus 8 characters, which exceeds the original VARCHAR(10)

ALTER TABLE api_keys
  ALTER COLUMN key_prefix TYPE VARCHAR(20);
