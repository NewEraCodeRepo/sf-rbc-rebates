import { FulfillmentState } from "../state";
import { FulfillmentContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { Validator } from "class-validator";
const validator = new Validator();

export const AmountMismatch: FulfillmentState = {
    status: TransactionStatus.FulfilledTransHasWrongAmount,

    async matches(context: FulfillmentContext) {
        const rebate = await context.getRebate();

        return validator.notEquals(rebate.amount, context.transaction.amount);
    }
};
