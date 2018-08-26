ALTER TABLE IF EXISTS transaction_for_rebate_criteria
  ADD COLUMN base_points INTEGER,
  ADD COLUMN card_type TEXT,
  ADD COLUMN transaction_date TIMESTAMPTZ,
  ADD COLUMN transaction_currency TEXT,
  ADD COLUMN transaction_postal_code TEXT,
  ADD COLUMN product_code_external TEXT,
  ADD COLUMN is_manual BOOLEAN;

ALTER TABLE IF EXISTS rebates
  RENAME COLUMN card_number TO card;

ALTER TABLE IF EXISTS transaction_for_rebate_criteria
  RENAME COLUMN card_number TO card;
