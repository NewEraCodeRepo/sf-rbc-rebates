ALTER TABLE IF EXISTS rebates ADD COLUMN qualifying_transaction jsonb;
ALTER TABLE IF EXISTS rebates ADD COLUMN fulfillment_transaction jsonb;
