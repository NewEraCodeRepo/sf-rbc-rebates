ALTER TABLE accounts ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN accounts.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE export_details ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN export_details.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE migrations ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN migrations.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE rebate_criteria ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN rebate_criteria.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE rebates ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN rebates.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE transaction_for_rebate_criteria ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN transaction_for_rebate_criteria.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE transaction_import_details ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN transaction_import_details.inserted_at IS 'Time this record was initially inserted';

ALTER TABLE users ADD COLUMN inserted_at timestamptz NOT NULL DEFAULT NOW();
COMMENT ON COLUMN users.inserted_at IS 'Time this record was initially inserted';

