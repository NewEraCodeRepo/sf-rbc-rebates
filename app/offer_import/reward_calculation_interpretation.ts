import { IRewardCalculation } from "../interfaces/reward_calculation";
import { ArithmeticOperation } from "../interfaces/arithmetic_operation";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import { OfferBenefitToCustomer } from "../interfaces/offer_benefit_to_customer";
import { IOfferTerms } from "../interfaces/offer_terms";
import { Big } from 'big.js';

const DOLLAR_BENEFITS = [
  OfferBenefitToCustomer.DollarsOff,
  OfferBenefitToCustomer.PercentageOffForDollars
];

/* const MUTLIPLIER_BENEFITS = [
  OfferBenefitToCustomer.MultiplierForPoints
]; */

const ABSOLUTE_BENEFITS = [
  OfferBenefitToCustomer.DollarsOff,
  OfferBenefitToCustomer.PointsTopUp
];

export class RewardCalculationInterpretation {
  public static from(terms: IOfferTerms) {
    return new RewardCalculationInterpretation(terms).result;
  }

  constructor(private readonly terms: IOfferTerms) {}

  public get result(): IRewardCalculation {
    return {
      operand: this.operand,
      operation: this.operation,
      unit: this.unit
    };
  }

  get operand() {
    let amount = new Big(this.terms.rebateAmount);

    /* commenting this out for now as requested by RBC. No amount should be deducted

    if (this.isBonusMultiplier) {
      amount = amount.minus(1);
    }*/

    if (this.deductsUnits) {
      amount = amount.times(-1);
    }

    return amount.toString();
  }

  get operation() {
    if (this.isAbsolute) {
      return ArithmeticOperation.Addition;
    } else {
      return ArithmeticOperation.Multiplication;
    }
  }

  get unit() {
    if (this.usesDollars) {
      return RewardType.Dollars;
    } else {
      return RewardType.Points;
    }
  }

  private get deductsUnits() {
    return this.usesDollars;
  }

  private get isAbsolute() {
    return this.benefitMatches(ABSOLUTE_BENEFITS);
  }

  /* private get isBonusMultiplier() {
    return this.benefitMatches(MUTLIPLIER_BENEFITS);
  } */

  private get usesDollars() {
    return this.benefitMatches(DOLLAR_BENEFITS);
  }

  private benefitMatches(criteria: OfferBenefitToCustomer[]) {
    return criteria.indexOf(this.terms.benefitToCustomer) >= 0;
  }
}
