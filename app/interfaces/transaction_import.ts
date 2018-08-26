export interface ITransactionImport {
  client_id: string;
  offer_id: string;
  transaction_id: string;
  type: string;
  card: string;
  amount: string;
  base_points: string;
  rebate_id: string;
  card_type: string;
  transaction_date: string;
  transaction_currency: string;
  account_id: string;
  transaction_postal_code: string;
  product_code_external: string;
  is_manual: string;
}
