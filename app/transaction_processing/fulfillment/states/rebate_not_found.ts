import { FulfillmentState } from "../state";
import { FulfillmentContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export const RebateNotFound: FulfillmentState = {
    status: TransactionStatus.RebateNotFound,

    async matches(context: FulfillmentContext) {
        const rebate = await context.getRebate();

        return typeof rebate === 'undefined';
    }
};
