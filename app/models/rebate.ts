import { CardType } from "datapipeline-schemas/rebateManagementObject";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import {ITransactionForRebateCriteria} from "datapipeline-schemas/rebateManagementObject";

export interface IRebate {
    id: string;
    userId: string;
    rebateCriteriaId: string;
    accountId: string;
    accountTransactionId: string;
    fulfilledTransactionId: string | null;
    fulfilledDate: Date | null;
    fulfilledAmount: string | null;
    amount: string;
    rewardType: RewardType;
    issuedAt: Date;
    status: string;
    deliveredAt: Date | null;
    dispatchedAt: Date ;
    card: string;
    cardType: CardType;
    lastMopSync: Date | null;
    qualifyingTransaction: ITransactionForRebateCriteria;
    fulfillmentTransaction: ITransactionForRebateCriteria | null;
}
