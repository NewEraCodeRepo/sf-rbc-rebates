CREATE TABLE rebates (
    id text,
    rebate_criteria_id	text,
    account_transaction_id	text,
    amount  numeric(18,2),
    reward_type  text,
    issued_at timestamptz default CURRENT_DATE,
    PRIMARY KEY(id)
);

COMMENT ON COLUMN rebates.id IS 'Unique ID of rebate';
COMMENT ON COLUMN rebates.rebate_criteria_id IS 'ID of offer';
COMMENT ON COLUMN rebates.account_transaction_id IS 'ID of transaction';
COMMENT ON COLUMN rebates.amount IS 'Rebate amount';
COMMENT ON COLUMN rebates.reward_type IS 'Reward type';
COMMENT ON COLUMN rebates.issued_at IS 'Time rebate was issued';
