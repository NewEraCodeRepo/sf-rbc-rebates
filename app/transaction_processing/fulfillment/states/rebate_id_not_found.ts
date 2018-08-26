import { FulfillmentState } from "../state";
import { FulfillmentContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export const RebateIdNotFound: FulfillmentState = {
    status: TransactionStatus.RebateIdNotFound,

    async matches(context: FulfillmentContext) {
        return !context.transaction.rebateId;
    }
};
