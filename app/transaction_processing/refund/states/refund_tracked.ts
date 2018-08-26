import { RefundState } from "../state";
import { RefundContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export const RefundTracked: RefundState = {
    status: TransactionStatus.RefundTrackedForReporting,

    async matches(context: RefundContext) {
        return context.isTrackingRefunds;
    }
};
