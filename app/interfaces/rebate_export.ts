export interface IRebateExport {
  id: string;
  client_id: string;
  offer_id: string;
  card: string;
  wmresult_id: string; // we should remove this.
  status: string;
  qualified_on: string;
  qualified_trans_id: string;
  rebate: string;
  rebate_type: string;
  fulfilled_on: string; // we should remove this.
  fulfilled_trans_id: string; // we should remove this.
  fulfilled_rebate: string; // we should remove this.
  fulfilled_wmresult_id: string; // we should remove this.
  card_type: string;
  instruction_sent_date: string; // we should remove this.
  account_id: string;
}
