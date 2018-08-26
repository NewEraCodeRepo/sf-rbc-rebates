DROP TABLE public.rebates;

CREATE SEQUENCE public.rebates_id_seq INCREMENT 1 START 50000;

CREATE TABLE rebates
(
    id SERIAL PRIMARY KEY NOT NULL,
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
COMMENT ON COLUMN rebates.id IS 'Unique ID of rebate';
COMMENT ON COLUMN rebates.rebate_criteria_id IS 'ID of offer';
COMMENT ON COLUMN rebates.account_transaction_id IS 'ID of transaction';
COMMENT ON COLUMN rebates.amount IS 'Rebate amount';
COMMENT ON COLUMN rebates.reward_type IS 'Reward type';
COMMENT ON COLUMN rebates.issued_at IS 'Time rebate was issued';
COMMENT ON COLUMN rebates.account_id IS 'ID for the account receiving rebate';
COMMENT ON COLUMN rebates.fulfilled_transaction_id IS 'ID of fulfillment transaction';
COMMENT ON COLUMN rebates.fulfilled_date IS 'Date rebate was fulfilled';
COMMENT ON COLUMN rebates.fulfilled_amount IS 'Fulfilled amount';
COMMENT ON COLUMN rebates.status IS 'Rebate status';
COMMENT ON COLUMN rebates.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE ONLY rebates ALTER COLUMN id SET DEFAULT nextval('rebates_id_seq'::regclass);