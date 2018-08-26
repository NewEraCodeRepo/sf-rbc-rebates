import { TransactionSetEvent, TransactionSetEventSerde } from "datapipeline-schemas/events/transactionSetEvent";
import { IDelivery } from "datapipeline-lib";
import { ILoggable } from "../../../../app/interfaces/loggable";
import { TransactionForRebateCriteriaRepository } from "../../../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { KafkaTransactionSerializer } from "../../serializers/transaction_serializer";

export class TransactionHandler {
    public static matches(name: string) {
        return name === "transactions";
    }

    public static getEventSerde(clientId: string) {
        return new TransactionSetEventSerde(clientId);
    }

    public static async process(message: IDelivery<TransactionSetEvent>, logger: ILoggable) {
        if (message.event && message.event.transaction) {
            const transactionEvent = message.event.transaction;
            const transactionData = KafkaTransactionSerializer.serialize(transactionEvent);
            const transactionRecord = await TransactionForRebateCriteriaRepository.upsert(transactionData);

            logger.info(`[RM status] - Transaction upserted: ${transactionRecord.id}`);

            return transactionRecord;
        } else {
          logger.info(`[RM status] - Transaction message invalid: ${message}`);
        }
    }
}
