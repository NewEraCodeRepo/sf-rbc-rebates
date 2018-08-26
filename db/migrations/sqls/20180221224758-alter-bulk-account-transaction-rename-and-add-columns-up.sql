ALTER TABLE IF EXISTS bulk_account_transactions_import
  RENAME TO transaction_import_details;

ALTER TABLE IF EXISTS transaction_import_details
  ADD COLUMN status TEXT,
  ADD COLUMN number_of_items_imported BIGINT;
