-- 008_business_tax_rate.sql
--
-- VAT rate becomes a business attribute rather than a constant in six places.
--
-- Previously every site computed tax as `subtotal * 0.16`, so changing the rate
-- meant finding six files and hoping none was missed. Worse, two of those sites
-- taxed the gross amount while discounting afterwards, overcharging the customer
-- and overstating the VAT owed.
--
-- The rate is a percentage (16, not 0.16) because that is how it is entered and
-- printed on a receipt. Existing rows are backfilled with the same 16% they were
-- already being charged, so no historical sale changes meaning.
--
-- Stored as NUMERIC(5,2) to allow a rate like 16.00 as well as future fractional
-- rates; some goods are zero-rated or exempt, which is a rate of 0, and a
-- business may need a rate that is not a whole number.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 16.00;

-- Backfill explicitly rather than relying on the DEFAULT, so this is correct even
-- against a table where the column already existed with a NULL.
UPDATE businesses
   SET tax_rate = 16.00
 WHERE tax_rate IS NULL;

-- Existing sales keep the tax they were actually charged, which is the point of
-- this migration: repricing history to match a new rate would be a lie. New sales
-- use the rate from the business row.
--
-- No backfill of sales.tax_amount is performed, deliberately. Recomputing it
-- would silently change what a receipt from last month claims to have charged,
-- and would disagree with the cash already banked against it.

COMMENT ON COLUMN businesses.tax_rate IS
  'VAT rate as a percentage (16 = 16%). Applied to the amount after discount. Zero-rates a business that is exempt.';