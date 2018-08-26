import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { Producer } from "../kafka/producers/producer";
import { RebateRepository } from "../database/repositories/rebate_repository";
import { FulfillmentContext } from "./fulfillment/context";

export class SuccessfulFulfilledRebate {

  public static async perform(context: FulfillmentContext, result: TransactionStatus, kafkaStreamer: Producer) {
    try {
      await new SuccessfulFulfilledRebate(context, result).perform(kafkaStreamer);
    } catch (e) {
      throw new Error(e);
    }
  }
    constructor(
        public context: FulfillmentContext,
        public result: TransactionStatus
    ) {}

    public async perform(kafkaStreamer: Producer) {
      try {
        const rebate = await this.context.getRebate();

        const updatedFields = {
          fulfilledTransactionId: this.context.transaction.transactionId,
          fulfilledAmount: this.context.transaction.amount,
          fulfilledDate: new Date(),
          fulfillmentTransaction: this.context.transaction,
          dispatchedAt: new Date(),
          status: this.result
        };

        await RebateRepository.update(rebate.id, updatedFields);

        Object.assign(rebate, updatedFields);

        await kafkaStreamer.dispatch(rebate);

      } catch (e) {
        throw new Error(e);
      }

    }
}
