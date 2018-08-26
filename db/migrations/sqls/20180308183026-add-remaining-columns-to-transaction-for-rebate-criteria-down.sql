ALTER TABLE IF EXISTS transaction_for_rebate_criteria DROP COLUMN base_points;
ALTER TABLE IF EXISTS transaction_for_rebate_criteria DROP COLUMN card_type;
ALTER TABLE IF EXISTS transaction_for_rebate_criteria DROP COLUMN transaction_date;
ALTER TABLE IF EXISTS transaction_for_rebate_criteria DROP COLUMN transaction_currency;
ALTER TABLE IF EXISTS transaction_for_rebate_criteria DROP COLUMN transaction_postal_code;
ALTER TABLE IF EXISTS transaction_for_rebate_criteria DROP COLUMN product_code_external;
ALTER TABLE IF EXISTS transaction_for_rebate_criteria DROP COLUMN is_manual;

ALTER TABLE IF EXISTS rebates
  RENAME COLUMN card TO card_number;

ALTER TABLE IF EXISTS transaction_for_rebate_criteria
  RENAME COLUMN card TO card_number;
