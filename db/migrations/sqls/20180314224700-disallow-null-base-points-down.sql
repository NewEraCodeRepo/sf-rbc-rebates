ALTER TABLE transaction_for_rebate_criteria
ALTER COLUMN base_points DROP DEFAULT;

ALTER TABLE transaction_for_rebate_criteria
ALTER COLUMN base_points DROP NOT NULL;
