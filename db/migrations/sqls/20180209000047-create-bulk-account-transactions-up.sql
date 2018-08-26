CREATE TABLE bulk_account_transactions_import (
  id BIGSERIAL,
  started_at	timestamptz,
  finished_at	timestamptz,
  PRIMARY KEY(id)
);

COMMENT ON COLUMN bulk_account_transactions_import.id IS 'Unique ID of bulk import';
COMMENT ON COLUMN bulk_account_transactions_import.started_at IS 'Time bulk import started';
COMMENT ON COLUMN bulk_account_transactions_import.finished_at IS 'Time bulk import finished';
