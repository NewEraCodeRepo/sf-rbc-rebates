UPDATE transaction_for_rebate_criteria SET transaction_date = NOW() WHERE transaction_date IS NULL;
ALTER TABLE transaction_for_rebate_criteria ALTER COLUMN transaction_date SET NOT NULL;
