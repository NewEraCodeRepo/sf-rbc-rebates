ALTER TABLE rebates
ADD COLUMN account_id text,
ADD COLUMN fulfilled_transaction_id text,
ADD COLUMN fulfilled_date timestamptz,
ADD COLUMN fulfilled_amount numeric(18,2),
ADD COLUMN status text;

COMMENT ON COLUMN rebates.account_id IS 'ID for the account receiving rebate';
COMMENT ON COLUMN rebates.fulfilled_transaction_id IS 'ID of fulfillment transaction';
COMMENT ON COLUMN rebates.fulfilled_date IS 'Date rebate was fulfilled';
COMMENT ON COLUMN rebates.fulfilled_amount IS 'Fulfilled amount';
COMMENT ON COLUMN rebates.status IS 'Rebate status';