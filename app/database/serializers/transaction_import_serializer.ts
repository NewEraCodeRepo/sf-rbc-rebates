import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { ITransactionImport} from "../../interfaces/transaction_import";
import { CardType } from "datapipeline-schemas/rebateManagementObject";

const TRANSACTION_TYPE_NUMBERS = {
  1: TransactionType.Qualifying,
  2: TransactionType.Fulfillment,
  3: TransactionType.Refund
};

const CARD_TYPE_NUMBERS = {
  1: CardType.CreditCard,
  2: CardType.CheckingAccount,
};

export class TransactionImportSerializer {
  public static serialize(object: ITransactionImport) {
    return {
      transaction_id: object.transaction_id,
      account_id: object.account_id,
      user_id: object.client_id,
      rebate_criteria_id: object.offer_id,
      rebate_id: object.rebate_id,
      amount: object.amount.toString(),
      transaction_type: TRANSACTION_TYPE_NUMBERS[object.type],
      card: object.card,
      base_points: object.base_points,
      card_type: CARD_TYPE_NUMBERS[object.card_type],
      transaction_date: object.transaction_date,
      transaction_currency: object.transaction_currency,
      transaction_postal_code: object.transaction_postal_code,
      product_code_external: object.product_code_external,
      is_manual: object.is_manual
    };
  }
}
