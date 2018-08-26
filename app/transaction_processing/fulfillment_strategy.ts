import { ILoggable } from "../interfaces/loggable";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { FulfillmentValidation } from "./fulfillment_validation";
import { SuccessfulFulfilledRebate } from "./successful_fulfilled_rebate";
import { TransactionUpdate } from "./transaction_update";
import { FulfillmentContext } from "./fulfillment/context";
import { Producer } from "app/kafka/producers/producer";
import {RebateJournalReportUpdate} from "./report/rebate_journal_update";

export class FulfillmentStrategy {
    public static matches(transaction: ITransactionForRebateCriteria) {
        return transaction.transactionType === "fulfillment";
    }

    public static async perform(transaction: ITransactionForRebateCriteria, kafkaStreamer: Producer, logger: ILoggable) {
      try {
        const context = new FulfillmentContext(transaction);
        const validation = new FulfillmentValidation(context);
        const result = await validation.result(logger);

        const transactionUpdate = new TransactionUpdate(transaction, result);
        await transactionUpdate.perform();

        if (result === TransactionStatus.FulfilledTransSuccessful) {
          await SuccessfulFulfilledRebate.perform(context, result, kafkaStreamer);
          await FulfillmentStrategy.updateJournalReport(context, logger);
        }
        logger.info(`Fulfillment status: ${result}`);
      } catch (e) {
        logger.error(`Fulfillment Error: ${e}`);
        return;
      }
    }

    protected static async updateJournalReport(context: FulfillmentContext, logger: ILoggable) {
        const updateJournalReport = new RebateJournalReportUpdate(
            context.transaction,
            await context.getRebate(),
            logger
        );

        await updateJournalReport.perform();
    }
}
