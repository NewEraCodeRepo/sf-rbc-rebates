CREATE TABLE account_transactions (
    id text,
    account_id	text,
    rebate_criteria_id	text,
    amount  numeric(18,2),
    processed_at timestamptz,
    PRIMARY KEY(id)
);

COMMENT ON COLUMN account_transactions.id IS 'Unique ID of transaction';
COMMENT ON COLUMN account_transactions.account_id IS 'ID of account';
COMMENT ON COLUMN account_transactions.rebate_criteria_id IS 'ID of offer';
COMMENT ON COLUMN account_transactions.amount IS 'Transaction Amount';
COMMENT ON COLUMN account_transactions.processed_at IS 'Time processed by RM. Used to check for new transactions';
