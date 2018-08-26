import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TransactionForRebateCriteriaRecord } from '../records/transaction_for_rebate_criteria_record';
import { CardType } from "datapipeline-schemas/rebateManagementObject";

export class TransactionForRebateCriteriaSerializer {
  public static serialize(object: ITransactionForRebateCriteria): TransactionForRebateCriteriaRecord {
    return {
      id: object.id,
      transaction_id: object.transactionId,
      account_id: object.accountId,
      user_id: object.userId,
      rebate_criteria_id: object.rebateCriteriaId,
      rebate_id: object.rebateId,
      amount: object.amount,
      processed_at: object.processedAt,
      transaction_type: object.transactionType,
      status: object.status,
      card: object.card,
      base_points: object.basePoints,
      card_type: object.cardType,
      transaction_date: object.transactionDate,
      transaction_currency: object.transactionCurrency,
      transaction_postal_code: object.transactionPostalCode,
      product_code_external: object.productCodeExternal,
      is_manual: object.isManual,
      tsys_customer_id: object.tsysCustomerId,
      refund_report_created: object.refundReportCreated,
      processor_id: object.processorId
    };
  }

  public static deserialize(record: TransactionForRebateCriteriaRecord): ITransactionForRebateCriteria {
    const processedAt = record.processed_at ? new Date(record.processed_at) : null;

    return {
      id: record.id,
      transactionId: record.transaction_id,
      accountId: record.account_id,
      userId: record.user_id,
      rebateCriteriaId: record.rebate_criteria_id,
      rebateId: record.rebate_id !== null ? record.rebate_id.toString() : record.rebate_id,
      amount: record.amount,
      processedAt,
      transactionType: record.transaction_type as TransactionType,
      status: record.status as TransactionStatus,
      card: record.card,
      basePoints: record.base_points,
      cardType: record.card_type as CardType,
      transactionDate: new Date(record.transaction_date),
      transactionCurrency: record.transaction_currency,
      transactionPostalCode: record.transaction_postal_code,
      productCodeExternal: record.product_code_external,
      isManual: record.is_manual,
      tsysCustomerId: record.tsys_customer_id,
      refundReportCreated: record.refund_report_created,
      processorId: record.processor_id
    };
  }
}
