import { ILoggable } from "../interfaces/loggable";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { RebateCriteriaRepository } from "../database/repositories/rebate_criteria_repository";
import { RefundValidation } from "./refund_validation";
import { TransactionUpdate } from "./transaction_update";
import { RefundContext } from "./refund/context";
import { Producer } from "../kafka/producers/producer";
import { RefundReportCreate } from "./report/refund_create";

export class RefundStrategy {
    public static matches(transaction: ITransactionForRebateCriteria) {
        return transaction.transactionType === "refund";
    }

    public static async perform(transaction: ITransactionForRebateCriteria, kafkaStreamer: Producer, logger: ILoggable) {
      try {
        const rebateCriteria = await RebateCriteriaRepository.find(transaction.rebateCriteriaId);

        const context = new RefundContext(transaction, rebateCriteria);
        const validation = new RefundValidation(context);
        const result = await validation.result();

        const update = new TransactionUpdate(transaction, result);
        await update.perform();

        await RefundStrategy.createRefundReport(context);

        logger.info('Refund status:', result);
      } catch (e) {
        logger.error(`Refund Error: ${e}`);
        return;
      }
    }

    protected static async createRefundReport(context: RefundContext) {
        if (context.rebateCriteriaIsMissing) {
            return false;
        }

        const refundReportCreate = new RefundReportCreate(
            context.transaction,
            context.rebateCriteria,
        );

        return await refundReportCreate.perform();
    }
}
