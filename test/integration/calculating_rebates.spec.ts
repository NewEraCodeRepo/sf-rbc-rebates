import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { RewardType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionStatus } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionProcessing } from '../../app/transaction_processing/index';
import { RebateRepository } from '../../app/database/repositories/rebate_repository';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { createTransactionForRebateCriteria } from '../fixtures/transaction_for_rebate_criteria';
import { TestLogger } from '../support/test_logger';
import { requiresDatabase } from '../support/database';
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";
import {createUser} from "../fixtures/user";

describe("Calculating rebates", () => {
  requiresDatabase();

  let logger;
  let initStub;
  let dispatchStub;

  beforeEach(() => {
      initStub = sinon.stub(RebateProducer.prototype, 'init').resolves(true);
      dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
      logger = new TestLogger();
  });

  afterEach(() => {
      initStub.restore();
      dispatchStub.restore();
  });

  it("calculates a simple dollar rebate", async () => {
    const user = await createUser();

    // Create a rebate criteria with $2 off
    await createRebateCriteria({
      id: 'REBATE-CRITERIA-1',
      descriptionForTesting: '$2 off',
      rewardCalculation: {
        operand: '-2',
        operation: ArithmeticOperation.Addition,
        unit: RewardType.Dollars
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false,
    });

    // Log a transaction with $10 spent
    await createTransactionForRebateCriteria({
      transactionId: 'TRANSACTION-1',
      amount: '10',
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      processedAt: null,
      transactionType: TransactionType.Qualifying,
      status: TransactionStatus.Pending,
      userId: user.id
    });

    // Run the transaction processing
    await TransactionProcessing.perform({ logger });

    // Assert that a $2 rebate was issued to the account
    const lastRebate = await RebateRepository.last();

    expect(lastRebate.accountTransactionId).to.eq('TRANSACTION-1');
    expect(lastRebate.amount).to.eq('2.00');
    expect(lastRebate.rewardType).to.eq(RewardType.Dollars);
    expect(lastRebate.rebateCriteriaId).to.eq('REBATE-CRITERIA-1');

    expect(logger.toString()).to.include('Issued a 2.00 dollars rebate');
  });

  it("calculates a simple points rebate", async () => {
    const user = await createUser();

    // Create a rebate criteria with $2 off
    await createRebateCriteria({
      id: 'REBATE-CRITERIA-1',
      descriptionForTesting: '+10 points',
      rewardCalculation: {
        operand: '10',
        operation: ArithmeticOperation.Addition,
        unit: RewardType.Points
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });

    // Log a transaction with 10 points
    await createTransactionForRebateCriteria({
      transactionId: 'TRANSACTION-1',
      amount: '10',
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      processedAt: null,
      transactionType: TransactionType.Qualifying,
      status: TransactionStatus.Pending,
      userId: user.id
    });

    // Run the transaction processing
    await TransactionProcessing.perform({ logger });

    // Assert that a 10 point rebate was issued to the account
    const lastRebate = await RebateRepository.last();

    expect(lastRebate.accountTransactionId).to.eq('TRANSACTION-1');
    expect(lastRebate.amount).to.eq('10.00');
    expect(lastRebate.rewardType).to.eq(RewardType.Points);
    expect(lastRebate.rebateCriteriaId).to.eq('REBATE-CRITERIA-1');

    expect(logger.toString()).to.include('Issued a 10.00 points rebate');
  });

  it("calculates a rebate with a percentage discount", async () => {
    const user = await createUser();

    // Create a rebate criteria with $2 off
    await createRebateCriteria({
      id: 'REBATE-CRITERIA-1',
      descriptionForTesting: '20% discount',
      rewardCalculation: {
        operand: '-0.2',
        operation: ArithmeticOperation.Multiplication,
        unit: RewardType.Dollars
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });

    // Log a transaction with $6.25
    await createTransactionForRebateCriteria({
      transactionId: 'TRANSACTION-1',
      amount: '6.25',
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      processedAt: null,
      transactionType: TransactionType.Qualifying,
      status: TransactionStatus.Pending,
      userId: user.id
    });

    // Run the transaction processing
    await TransactionProcessing.perform({ logger });

    // Assert that a $1.25 rebate was issued to the account
    const lastRebate = await RebateRepository.last();

    expect(lastRebate.accountTransactionId).to.eq('TRANSACTION-1');
    expect(lastRebate.amount).to.eq('1.25');
    expect(lastRebate.rewardType).to.eq(RewardType.Dollars);
    expect(lastRebate.rebateCriteriaId).to.eq('REBATE-CRITERIA-1');

    expect(logger.toString()).to.include('Issued a 1.25 dollars rebate');
  });

  it("calculates a point multiplier", async () => {
    const user = await createUser();

    // Create a rebate criteria with a 2x points addition
    await createRebateCriteria({
      id: 'REBATE-CRITERIA-1',
      descriptionForTesting: 'Double points',
      rewardCalculation: {
        operand: '2',
        operation: ArithmeticOperation.Multiplication,
        unit: RewardType.Points
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false,
      redemptionPeriodInDays: 50
    });

    // Log a transaction with 5 base points
    await createTransactionForRebateCriteria({
      transactionId: 'TRANSACTION-1',
      basePoints: 5,
      rebateCriteriaId: 'REBATE-CRITERIA-1',
      processedAt: null,
      transactionType: TransactionType.Qualifying,
      status: TransactionStatus.Pending,
      userId: user.id
    });

    // Run the transaction processing
    await TransactionProcessing.perform({ logger });

    // Assert that a 10 point was issued to the account
    const lastRebate = await RebateRepository.last();

    expect(lastRebate.accountTransactionId).to.eq('TRANSACTION-1');
    expect(lastRebate.amount).to.eq('10.00');
    expect(lastRebate.rewardType).to.eq(RewardType.Points);
    expect(lastRebate.rebateCriteriaId).to.eq('REBATE-CRITERIA-1');

    expect(logger.toString()).to.include('Issued a 10.00 points rebate');
  });
});
