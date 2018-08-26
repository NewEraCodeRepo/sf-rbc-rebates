import { IDelivery, IPublishResult, IPublisher, buildPublisher, buildPublishingTransform
} from "datapipeline-lib";
import {IRebatePayload, TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import {IRebate} from "../../models/rebate";
import {RebateSetEvent} from "datapipeline-schemas/events/rebateSetEvent";

export function buildRebateEventFn():
    (rebate: IRebate) => any {
        return (rebate: IRebate): RebateSetEvent => {
            const fulfilledDate: Date | null = rebate.fulfilledDate;
            const fulfilledTransactionId: string | null = rebate.fulfilledTransactionId;

            const payload: IRebatePayload = {
                id: rebate.id,
                userId: rebate.userId,
                accountId: rebate.accountId,
                offerId: rebate.rebateCriteriaId,
                amount: rebate.amount,
                rewardType: rebate.rewardType,
                fulfilledAt: fulfilledDate,
                issuedAt: rebate.issuedAt,
                qualifiedTransactionId: rebate.accountTransactionId,
                fulfilledTransactionId,
                status: rebate.status as TransactionStatus,
                qualifyingTransaction: rebate.qualifyingTransaction,
                fulfillmentTransaction: rebate.fulfillmentTransaction
            };

            return new RebateSetEvent(rebate.id, payload);
        };
    }
