DROP TABLE IF EXISTS account_transactions;

CREATE TABLE transaction_for_rebate_criteria (
  id BIGSERIAL,
  transaction_id text,
  account_id	text,
  rebate_criteria_id	text,
  amount  numeric(18,2),
  processed_at timestamptz,
  transaction_type	text,
  status	text,
  user_id	text,
  rebate_id	text,
  PRIMARY KEY(id)
);

COMMENT ON COLUMN transaction_for_rebate_criteria.id IS 'Unique generated serial id';
COMMENT ON COLUMN transaction_for_rebate_criteria.transaction_id IS 'ID of transaction';
COMMENT ON COLUMN transaction_for_rebate_criteria.account_id IS 'ID of account';
COMMENT ON COLUMN transaction_for_rebate_criteria.rebate_criteria_id IS 'ID of offer';
COMMENT ON COLUMN transaction_for_rebate_criteria.amount IS 'Transaction Amount';
COMMENT ON COLUMN transaction_for_rebate_criteria.processed_at IS 'Time processed by RM. Used to check for new transactions';
COMMENT ON COLUMN transaction_for_rebate_criteria.status IS 'Status of transaction process';
