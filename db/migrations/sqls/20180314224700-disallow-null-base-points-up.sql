ALTER TABLE transaction_for_rebate_criteria
ALTER COLUMN base_points SET DEFAULT 0;

UPDATE transaction_for_rebate_criteria
SET base_points = 0 WHERE base_points IS NULL;

ALTER TABLE transaction_for_rebate_criteria
ALTER COLUMN base_points SET NOT NULL;
