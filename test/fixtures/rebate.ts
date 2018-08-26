import * as faker from "faker";
import { IRebate } from "../../app/models/rebate";
import { randomEnumValue } from "../support/random_enum_value";
import { dateAppropriateForTesting, randomAmount, ensureVerifiableDates } from "../support/fixtures";
import { RebateRepository } from "../../app/database/repositories/rebate_repository";
import {maskedCardNumber} from "../support/masked_card_number";
import { RewardType, CardType } from "datapipeline-schemas/sharedData";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";

export default function buildRebate(attributes: Partial<IRebate> = {}): IRebate {
  ensureVerifiableDates(attributes, 'fulfilledDate', 'issuedAt', 'deliveredAt', 'dispatchedAt');

  const id = `REBATE-${faker.random.uuid()}`;
  let fulfillmentAttributes;

  const wasFulfilled = faker.random.boolean();
  const wasExtracted = faker.random.boolean();

  if (wasFulfilled) {
    fulfillmentAttributes = {
      fulfilledTransactionId: `T${faker.random.uuid()}`,
      fulfilledDate: dateAppropriateForTesting(),
      fulfilledAmount: randomAmount(),
      deliveredAt: dateAppropriateForTesting(),
      dispatchedAt: dateAppropriateForTesting(),
    };
  } else if (wasExtracted) {
    fulfillmentAttributes = {
      fulfilledTransactionId: null,
      fulfilledDate: null,
      fulfilledAmount: null,
      deliveredAt: dateAppropriateForTesting(),
      dispatchedAt: dateAppropriateForTesting(),
    };
  } else {
    fulfillmentAttributes = {
      fulfilledTransactionId: null,
      fulfilledDate: null,
      fulfilledAmount: null,
      deliveredAt: null,
      dispatchedAt: dateAppropriateForTesting(),
    };
  }

  return {
    id,
    userId: `U${faker.random.uuid()}`,
    rebateCriteriaId: `RC${faker.random.uuid()}`,
    accountId: `A_TEST_ACCOUNT`,
    accountTransactionId: `T${faker.random.uuid()}`,
    amount: randomAmount(),
    rewardType: randomEnumValue(RewardType),
    issuedAt: dateAppropriateForTesting(),
    status: 'unknown',
    card: maskedCardNumber,
    cardType: randomEnumValue(CardType),
    lastMopSync: null,
    qualifyingTransaction: {} as ITransactionForRebateCriteria,
    fulfillmentTransaction: {} as ITransactionForRebateCriteria,
    ...fulfillmentAttributes,
    ...attributes
  };
}

export async function createRebate(attributes: Partial<IRebate> = {}) {
  return await RebateRepository.insert(buildRebate(attributes));
}
