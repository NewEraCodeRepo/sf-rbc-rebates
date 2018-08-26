import { IRebate } from '../../models/rebate';
import { CardType } from "datapipeline-schemas/rebateManagementObject";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import { RebateRecord } from '../records/rebate_record';

export class RebateSerializer {
    public static serialize(object: IRebate): RebateRecord {
        return {
            user_id: object.userId,
            rebate_criteria_id: object.rebateCriteriaId,
            account_id: object.accountId,
            account_transaction_id: object.accountTransactionId,
            fulfilled_transaction_id: object.fulfilledTransactionId,
            fulfilled_date: object.fulfilledDate,
            fulfilled_amount: object.fulfilledAmount,
            amount: object.amount,
            reward_type: object.rewardType,
            issued_at: object.issuedAt,
            status: object.status,
            delivered_at: object.deliveredAt,
            dispatched_at: object.dispatchedAt,
            card: object.card,
            card_type: object.cardType,
            last_mop_sync: object.lastMopSync,
            qualifying_transaction: object.qualifyingTransaction,
            fulfillment_transaction: object.fulfillmentTransaction
        };
    }

    public static deserialize(record: RebateRecord): IRebate {
        return {
            id: record.id!.toString(),
            userId: record.user_id,
            rebateCriteriaId: record.rebate_criteria_id,
            accountId: record.account_id,
            accountTransactionId: record.account_transaction_id,
            fulfilledTransactionId: record.fulfilled_transaction_id,
            fulfilledDate: record.fulfilled_date,
            fulfilledAmount: record.fulfilled_amount,
            amount: record.amount,
            rewardType: record.reward_type as RewardType,
            issuedAt: record.issued_at,
            status: record.status,
            deliveredAt: record.delivered_at,
            dispatchedAt: record.dispatched_at,
            card: record.card,
            cardType: record.card_type as CardType,
            lastMopSync: record.last_mop_sync,
            qualifyingTransaction: record.qualifying_transaction,
            fulfillmentTransaction: record.fulfillment_transaction
        };
    }
}
