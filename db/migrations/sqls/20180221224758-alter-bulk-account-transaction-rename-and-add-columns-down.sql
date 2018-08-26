ALTER TABLE IF EXISTS transaction_import_details DROP column status;
ALTER TABLE IF EXISTS transaction_import_details DROP column number_of_items_imported;

ALTER TABLE IF EXISTS transaction_import_details
  RENAME TO bulk_account_transactions_import;
