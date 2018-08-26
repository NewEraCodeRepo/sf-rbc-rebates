import { FulfillmentState } from "../state";
import { FulfillmentContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { RebateRepository } from "../../../database/repositories/rebate_repository";
import { Validator } from "class-validator";
const validator = new Validator();

export const TransactionUsed: FulfillmentState = {
    status: TransactionStatus.FulfilledTransUsedAlready,

    async matches(context: FulfillmentContext) {
        const otherRebatesUsingFulfillment = await RebateRepository.findAll({
            where: { fulfilled_transaction_id: context.transaction.transactionId }
        });

        return validator.arrayNotEmpty(otherRebatesUsingFulfillment);
    }
};
