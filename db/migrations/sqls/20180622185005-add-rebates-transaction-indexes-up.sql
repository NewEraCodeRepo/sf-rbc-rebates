CREATE INDEX rebates_transaction_id_idx ON rebates(fulfilled_transaction_id);
CREATE INDEX transaction_user_offer_status_idx on transaction_for_rebate_criteria(user_id, rebate_criteria_id, status);
CREATE INDEX rebates_offer_user_idx ON rebates(rebate_criteria_id, user_id);