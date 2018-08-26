import { Big } from "big.js";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { ArithmeticOperation } from "../interfaces/arithmetic_operation";
import { IRewardCalculation } from "../interfaces/reward_calculation";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";

export interface RebateCalculationResult {
  amount: Big;
  explanation: string;
}

export class RebateCalculation {
  public static for(
    transaction: ITransactionForRebateCriteria,
    rewardCalculation: IRewardCalculation
  ) {
    return new RebateCalculation(transaction, rewardCalculation).result;
  }

  constructor(
    public transaction: ITransactionForRebateCriteria,
    public rewardCalculation: IRewardCalculation
  ) {}

  public get result(): RebateCalculationResult {
    let amount = new Big(this.rewardCalculation.operand);

    if (this.isDeduction) {
      amount = amount.times(-1);
    }

    let explanation = `Calculation: ${amount.toString()} `;

    if (this.isMultiplication) {
      explanation += `* ${this.factor.toString()} `;
      amount = amount.times(this.factor);
    }

    explanation += `${this.rewardCalculation.unit} due`;

    return { amount, explanation };
  }

  private get factor() {
    let value;

    if (this.isDollars) {
      value = this.transaction.amount;
    } else {
      value = this.transaction.basePoints;
    }

    return new Big(value);
  }

  private get isDeduction() {
    return this.isDollars;
  }

  private get isDollars() {
    return this.rewardCalculation.unit === RewardType.Dollars;
  }

  private get isMultiplication() {
    return this.rewardCalculation.operation === ArithmeticOperation.Multiplication;
  }
}
