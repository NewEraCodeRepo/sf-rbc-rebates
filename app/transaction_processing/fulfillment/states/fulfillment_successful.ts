import { FulfillmentState } from "../state";
import { FulfillmentContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export const FulfillmentSuccessful: FulfillmentState = {
    status: TransactionStatus.FulfilledTransSuccessful,

    async matches(context: FulfillmentContext) {
        return true;
    }
};
