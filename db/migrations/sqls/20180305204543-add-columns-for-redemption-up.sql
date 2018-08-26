ALTER TABLE transaction_for_rebate_criteria ADD COLUMN card_number text;
ALTER TABLE rebate_criteria ADD COLUMN redemption_limit integer;
ALTER TABLE rebate_criteria ADD COLUMN redemption_limit_type text;
ALTER TABLE rebates ADD COLUMN card_number text;
