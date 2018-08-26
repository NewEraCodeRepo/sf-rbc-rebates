import * as faker from "faker";
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { IRebateCriteria } from "../../app/models/rebate_criteria";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import { randomEnumValue } from "../support/random_enum_value";
import { RebateCriteriaRepository } from "../../app/database/repositories/rebate_criteria_repository";
import { dateAppropriateForTesting, ensureVerifiableDates } from "../support/fixtures";
import { IRewardCalculation } from "../../app/interfaces/reward_calculation";
import { RedemptionLimitType } from "../../app/interfaces/redemption_limit_type";
import * as moment from "moment";
import { OfferType } from "datapipeline-schemas/salesforceObject";
import createEligibleProduct from "./product_based";

export default function buildRebateCriteria(attributes: Partial<IRebateCriteria> = {}): IRebateCriteria {
  ensureVerifiableDates(attributes, 'validFromDate', 'validToDate');

  const id = `${faker.random.number({max: 99999})}`;

  const rewardCalculation: IRewardCalculation = {
    operand: faker.random.number({ min: 0, max: 10000 }).toString(),
    operation: randomEnumValue(ArithmeticOperation),
    unit: randomEnumValue(RewardType),
    ...attributes.rewardCalculation,
  };

  return {
    id,
    descriptionForTesting: null,
    isRedeemable: faker.random.boolean(),
    refundPeriodInDays: faker.random.number({ min: 1, max: 30 }),
    rewardCalculation,
    merchantId: faker.random.number(100000).toString(),
    validFromDate: dateAppropriateForTesting(moment.utc().subtract(1, "days").toDate()),
    validToDate: dateAppropriateForTesting(faker.date.future(2)),
    hasBeenActivated: faker.random.boolean(),
    requiresCustomerToBeLinked: faker.random.boolean(),
    requiresCustomerToBeTargeted: faker.random.boolean(),
    redemptionLimit: faker.random.number(),
    redemptionLimitType: randomEnumValue(RedemptionLimitType),
    redemptionPeriodInDays: faker.random.number({ min: 1, max: 30 }),
    eligibleProducts: createEligibleProduct(),
    redemptionBasedOn: OfferType.ClientBased,
    ...attributes
  };
}

export async function createRebateCriteria(attributes: Partial<IRebateCriteria> = {}) {
  return await RebateCriteriaRepository.insert(buildRebateCriteria(attributes));
}
