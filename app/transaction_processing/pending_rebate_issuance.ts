import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import { Big, RoundingMode } from "big.js";
import { RebateRepository } from "../database/repositories/rebate_repository";
import { IRebate } from "../models/rebate";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export class PendingRebateIssuance {
  constructor(
    public readonly transaction: ITransactionForRebateCriteria,
    public readonly amount: Big,
    public readonly rewardType: RewardType
  ) {}

  public async perform(): Promise<IRebate> {
    const properlyRoundedAmount = this.rewardType === RewardType.Points ?
      this.amount.round(0, RoundingMode.RoundHalfUp).toFixed(2) : this.amount.toFixed(2);

    const rebate: IRebate = {
      id: "PLACEHOLDER",
      userId: this.transaction.userId,
      accountId: this.transaction.accountId,
      accountTransactionId: this.transaction.transactionId,
      fulfilledTransactionId: null,
      fulfilledDate: null,
      fulfilledAmount: null,
      rebateCriteriaId: this.transaction.rebateCriteriaId,
      rewardType: this.rewardType,
      amount: properlyRoundedAmount,
      issuedAt: new Date(),
      card: this.transaction.card,
      cardType: this.transaction.cardType,
      status: TransactionStatus.PendingExtraction,
      deliveredAt: null,
      dispatchedAt: new Date(),
      lastMopSync: null,
      qualifyingTransaction: this.transaction,
      fulfillmentTransaction: null
    };

    return await RebateRepository.insert(rebate);
  }
}
