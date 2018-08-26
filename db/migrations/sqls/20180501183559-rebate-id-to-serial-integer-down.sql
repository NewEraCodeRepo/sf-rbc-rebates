DROP SEQUENCE public.rebates_id_seq;

DROP TABLE rebates;

CREATE TABLE rebates_qa
(
    id TEXT PRIMARY KEY NOT NULL,
    rebate_criteria_id TEXT,
    account_transaction_id TEXT,
    amount NUMERIC(18,2),
    reward_type TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    account_id TEXT,
    fulfilled_transaction_id TEXT,
    fulfilled_date TIMESTAMP WITH TIME ZONE,
    fulfilled_amount NUMERIC(18,2),
    status TEXT,
    user_id TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    card TEXT,
    card_type TEXT,
    last_mop_sync TIMESTAMP WITH TIME ZONE,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    qualifying_transaction JSONB,
    fulfillment_transaction JSONB,
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
);
COMMENT ON COLUMN rebates_qa.id IS 'Unique ID of rebate';
COMMENT ON COLUMN rebates_qa.rebate_criteria_id IS 'ID of offer';
COMMENT ON COLUMN rebates_qa.account_transaction_id IS 'ID of transaction';
COMMENT ON COLUMN rebates_qa.amount IS 'Rebate amount';
COMMENT ON COLUMN rebates_qa.reward_type IS 'Reward type';
COMMENT ON COLUMN rebates_qa.issued_at IS 'Time rebate was issued';
COMMENT ON COLUMN rebates_qa.account_id IS 'ID for the account receiving rebate';
COMMENT ON COLUMN rebates_qa.fulfilled_transaction_id IS 'ID of fulfillment transaction';
COMMENT ON COLUMN rebates_qa.fulfilled_date IS 'Date rebate was fulfilled';
COMMENT ON COLUMN rebates_qa.fulfilled_amount IS 'Fulfilled amount';
COMMENT ON COLUMN rebates_qa.status IS 'Rebate status';
COMMENT ON COLUMN rebates_qa.inserted_at IS 'Time this record was initially inserted';