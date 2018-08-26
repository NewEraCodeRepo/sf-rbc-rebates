import { RefundState } from "../state";
import { RefundContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export const RefundNotTracked: RefundState = {
    status: TransactionStatus.RefundNotTrackedForReporting,

    async matches(context: RefundContext) {
        return !context.isTrackingRefunds;
    }
};
