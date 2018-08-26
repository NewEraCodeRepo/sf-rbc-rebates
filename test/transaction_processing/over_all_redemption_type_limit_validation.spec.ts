import { expect } from "chai";
import "mocha";
import {createUser} from "../fixtures/user";
import {createRebateCriteria} from "../fixtures/rebate_criteria";
import { RedemptionLimitType } from "../../app/interfaces/redemption_limit_type";
import {RewardType} from "datapipeline-schemas/rebateManagementObject";
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import {TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import {TransactionProcessing} from "../../app/transaction_processing/index";
import {TestLogger} from "../support/test_logger";
import {requiresDatabase} from "../support/database";
import {createTransactionForRebateCriteria} from "../fixtures/transaction_for_rebate_criteria";
import {TransactionType} from "datapipeline-schemas/rebateManagementObject";
import {TransactionForRebateCriteriaRepository} from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import {createRebate} from "../fixtures/rebate";
import {createUserLedger} from "../fixtures/user_ledger";
import * as moment from "moment-timezone";
import * as sinon from "sinon";
import {UserLedgerRepository} from "../../app/database/repositories/user_ledger_repository";
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";

describe("Issuing over all type redemptions", () => {
  requiresDatabase();
  const now = new Date();

  let logger;
  let initStub;
  let dispatchStub;

  beforeEach(async () => {
    logger = new TestLogger();
    initStub = sinon.stub(RebateProducer.prototype, 'init').resolves(true);
    dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
    const allUserLedgers = await UserLedgerRepository.findAll();
    allUserLedgers.forEach(async (userLedger) => {
      await UserLedgerRepository.bulkDeleteWhere({ user_id: userLedger.userId });
    });
  });

  afterEach(() => {
    initStub.restore();
    dispatchStub.restore();
  });

  it("expect a transaction to fail if the number of redemptions is over the redemption limit", async () => {
    // create rebate criteria
    await createRebateCriteria({
      id: "REBATE-CRITERIA-1",
      redemptionLimit: 1,
      descriptionForTesting: 'Overall Redemption',
      redemptionLimitType: RedemptionLimitType.Overall,
      requiresCustomerToBeLinked: true,
      rewardCalculation: {
        unit: RewardType.Dollars,
        operand: '-2.0',
        operation: ArithmeticOperation.Addition
      },
      isRedeemable: true,
      hasBeenActivated: true,
      refundPeriodInDays: 24,
      validFromDate: moment.utc(now).subtract(20, "days").toDate(),
      validToDate: moment.utc(now).add(60, "days").toDate(),
      redemptionPeriodInDays: 40
    });

    // create user
    await createUser({
      id: '5',
      linkedOfferIds: ['REBATE-CRITERIA-1'],
      targetedOfferIds: ['REBATE-CRITERIA-1'],
      isEnrolled: true
    });

    // create user ledger
    await createUserLedger({
      userId: '5',
      targetedOffers: ['REBATE-CRITERIA-1'],
      linkedOffers: ['REBATE-CRITERIA-1'],
      isEnrolledToMyOffers: true,
      updateTimestamp: moment.utc(now).toDate()
    });

    // CREATE TWO FULFILLED REBATES AND TWO FULFILLED TRANSACTIONS

    // FIRST
    // log a qualifying transaction
    const firstTransaction = await createTransactionForRebateCriteria ( {
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      transactionId: "TRANSACTION-1",
      amount: "10",
      userId: '5',
      processedAt: null,
      rebateId: "1",
      status: TransactionStatus.RebateCreated,
      transactionDate: moment(now).toDate(),
      transactionType: TransactionType.Qualifying,
    });

    // log a fulfillment transaction
    await createTransactionForRebateCriteria( {
      id: firstTransaction.id,
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      transactionId: "TRANSACTION-1",
      amount: "10",
      userId: '5',
      processedAt: null,
      rebateId: "1",
      status: TransactionStatus.FulfilledTransSuccessful,
      transactionDate: moment(now).toDate(),
      transactionType: TransactionType.Fulfillment,
    });

    // log a rebate
    await createRebate({
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      id: "1",
      accountTransactionId: "TRANSACTION-1",
      userId: '5',
      amount: "2",
      status: TransactionStatus.FulfilledTransSuccessful,
    });

    // SECOND
    // log a qualifying transaction
    const secondTransaction = await createTransactionForRebateCriteria ( {
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      transactionId: "TRANSACTION-2",
      amount: "10",
      userId: '5',
      processedAt: null,
      rebateId: "2",
      status: TransactionStatus.RebateCreated,
      transactionDate: moment(now).toDate(),
      transactionType: TransactionType.Qualifying,
    });

    // log a fulfillment transaction
    await createTransactionForRebateCriteria( {
      id: secondTransaction.id,
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      transactionId: "TRANSACTION-2",
      amount: "10",
      userId: '5',
      processedAt: null,
      rebateId: "2",
      status: TransactionStatus.FulfilledTransSuccessful,
      transactionDate: moment(now).toDate(),
      transactionType: TransactionType.Fulfillment,
    });

    // log a rebate
    await createRebate({
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      id: "2",
      accountTransactionId: "TRANSACTION-2",
      userId: '5',
      amount: "2",
      status: TransactionStatus.FulfilledTransSuccessful,
    });

    // CREATE A QUALIFIED TRANSACTION
    const firstQualifyingTransaction = await createTransactionForRebateCriteria({
      transactionId: 'TRANSACTION-3',
      userId: '5',
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      amount: '10',
      processedAt: null,
      transactionType: TransactionType.Qualifying,
      transactionDate: moment(now).toDate(),
      status: TransactionStatus.Pending
    });

    await TransactionProcessing.perform({ logger });

    const failedTransaction = await TransactionForRebateCriteriaRepository.findOrFail(firstQualifyingTransaction.id);
    expect(failedTransaction.status).to.eq(TransactionStatus.ClientReachedOverallRedLimit);
  });

  it("expect a transaction to pass if the number of redemptions is under the redemption limit", async () => {
    // create rebate criteria
    await createRebateCriteria({
      id: "REBATE-CRITERIA-3",
      redemptionLimit: 4,
      descriptionForTesting: 'Overall Redemption',
      redemptionLimitType: RedemptionLimitType.Overall,
      requiresCustomerToBeLinked: true,
      rewardCalculation: {
        unit: RewardType.Dollars,
        operand: '-2.0',
        operation: ArithmeticOperation.Addition
      },
      isRedeemable: true,
      hasBeenActivated: true,
      refundPeriodInDays: 24,
      validFromDate: moment.utc(now).subtract(20, "days").toDate(),
      validToDate: moment.utc(now).add(60, "days").toDate(),
      redemptionPeriodInDays: 40
    });

    // create user
    await createUser({
      id: '6',
      linkedOfferIds: ['REBATE-CRITERIA-3'],
      targetedOfferIds: ['REBATE-CRITERIA-3'],
      isEnrolled: true
    });

    // create user ledger
    await createUserLedger({
      userId: '6',
      targetedOffers: ['REBATE-CRITERIA-3'],
      linkedOffers: ['REBATE-CRITERIA-3'],
      isEnrolledToMyOffers: true,
      updateTimestamp: moment.utc(now).toDate()
    });

    // CREATE ONE FULLFILLED REBATE AND ONE FULLFILLED TRANSACTION

    // log a qualifying transaction
    await createTransactionForRebateCriteria ( {
      rebateCriteriaId: 'REBATE-CRITERIA-3',
      transactionId: "TRANSACTION-1",
      amount: "10",
      userId: '6',
      processedAt: null,
      rebateId: "3",
      status: TransactionStatus.RebateCreated,
      transactionDate: moment(now).toDate(),
      transactionType: TransactionType.Qualifying,
    });

    // log a fulfillment transaction
    await createTransactionForRebateCriteria( {
      rebateCriteriaId: 'REBATE-CRITERIA-3',
      transactionId: "TRANSACTION-2",
      amount: "10",
      userId: '6',
      processedAt: null,
      rebateId: "3",
      status: TransactionStatus.FulfilledTransSuccessful,
      transactionDate: moment(now).toDate(),
      transactionType: TransactionType.Fulfillment,
    });

    // CREATE A QUALIFIED TRANSACTION
    const firstQualifyingTransaction = await createTransactionForRebateCriteria({
      transactionId: 'TRANSACTION-3',
      userId: '6',
      rebateCriteriaId: 'REBATE-CRITERIA-3',
      amount: '10',
      processedAt: null,
      transactionDate: moment(now).toDate(),
      transactionType: TransactionType.Qualifying
    });

    await TransactionProcessing.perform({ logger });
    const successfulTransaction = await TransactionForRebateCriteriaRepository.findOrFail(firstQualifyingTransaction.id);
    expect(successfulTransaction.status).to.eq(TransactionStatus.RebateCreated);
  });

});
