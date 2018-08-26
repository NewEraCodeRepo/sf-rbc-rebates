import * as faker from "faker";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { randomEnumValue } from "../support/random_enum_value";
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { dateAppropriateForTesting, ensureVerifiableDates, randomAmount } from "../support/fixtures";
import { maskedCardNumber } from "../support/masked_card_number";
import { CardType } from "datapipeline-schemas/rebateManagementObject";
import * as moment from "moment";
import { createCreditCardProductCode, createDebitCardProductCode } from "./product_based";

export default function buildTransactionForRebateCriteria(attributes: Partial<ITransactionForRebateCriteria> = {}): any {
  ensureVerifiableDates(attributes, 'processedAt', 'transactionDate');

  let productCode;
  const cardType = attributes.cardType || randomEnumValue(CardType);

  if (cardType === CardType.CreditCard) {
    productCode = createCreditCardProductCode();
  } else {
    productCode = createDebitCardProductCode();
  }

  return {
    id: faker.random.number().toString(),
    transactionId: `RC${faker.random.uuid()}`,
    accountId: `A_TEST_ACCOUNT`,
    userId: `CL${faker.random.uuid()}`,
    rebateCriteriaId: `RC${faker.random.uuid()}`,
    rebateId: faker.random.number(5000000).toString(),
    amount: randomAmount(),
    processedAt: faker.helpers.randomize([null, dateAppropriateForTesting()]),
    transactionType: randomEnumValue(TransactionType),
    status: randomEnumValue(TransactionStatus),
    card: maskedCardNumber,
    basePoints: faker.random.number(),
    cardType,
    transactionDate: dateAppropriateForTesting(moment.utc().add(1, "days").toDate()),
    transactionCurrency: "CAD",
    transactionPostalCode: faker.address.zipCode().toString(),
    productCodeExternal: productCode,
    isManual: faker.random.boolean(),
    tsysCustomerId: `TC${faker.random.uuid()}`,
    refundReportCreated: true,
    processorId: faker.random.number(),
    ...attributes
  };
}

export async function createTransactionForRebateCriteria(attributes: Partial<ITransactionForRebateCriteria> = {}) {
  return await TransactionForRebateCriteriaRepository.insert(
    buildTransactionForRebateCriteria(attributes)
  );
}
