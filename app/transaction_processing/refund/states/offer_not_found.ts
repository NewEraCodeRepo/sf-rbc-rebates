import { RefundState } from "../state";
import { RefundContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export const OfferNotFound: RefundState = {
    status: TransactionStatus.OfferNotFound,

    async matches(context: RefundContext) {
        return context.rebateCriteriaIsMissing;
    }
};
