import { expect } from "chai";
import { requiresDatabase } from "../support/database";
import { QualifyingStrategy } from "../../app/transaction_processing/qualifying_strategy";
import { TestLogger } from "../support/test_logger";
import { createTransactionForRebateCriteria } from "../fixtures/transaction_for_rebate_criteria";
import { RebateRepository } from "../../app/database/repositories/rebate_repository";
import { createRebateCriteria } from "../fixtures/rebate_criteria";
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { MockKafkaProducer } from "../support/kafka/mock_producer";
import {createUser} from "../fixtures/user";

describe("Qualifying rebates", () => {
  requiresDatabase();

  let logger;
  let mockKafkaProducer;

  beforeEach(() => {
    logger = new TestLogger();
    mockKafkaProducer = new MockKafkaProducer();
  });

  it("logs when a criteria can't be found", async () => {
    const transaction: any = await createTransactionForRebateCriteria();

    await QualifyingStrategy.perform(transaction, mockKafkaProducer, logger);

    expect(logger.toString()).to.include('Criteria not found');
    expect(await RebateRepository.count()).to.eq(0);
  });

  it("issues a pending rebate while logging the intent", async () => {
    const user = await createUser();

    const rebateCriteria = await createRebateCriteria({
      rewardCalculation: {
        operand: '-5',
        operation: ArithmeticOperation.Addition,
        unit: RewardType.Dollars
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });

    const transaction: any = await createTransactionForRebateCriteria({
      rebateCriteriaId: rebateCriteria.id,
      amount: '12.23',
      userId: user.id
    });

    await QualifyingStrategy.perform(transaction, mockKafkaProducer, logger);

    expect(logger.toString()).to.include('5 dollars due');
    expect(logger.toString()).to.include('Issued a 5.00 dollars rebate');

    const rebate = await RebateRepository.last();
    expect(rebate.amount).to.eq('5.00');
    expect(rebate.userId).to.eq(transaction.userId);
    expect(rebate.accountTransactionId).to.eq(transaction.transactionId);

    expectToBeProcessed(transaction, TransactionStatus.RebateCreated);
  });

  it("issues a pending rebate for points with the values rounded appropriately", async () => {
    const user = await createUser();

    const rebateCriteria = await createRebateCriteria({
      rewardCalculation: {
        operand: '2.4',
        operation: ArithmeticOperation.Multiplication,
        unit: RewardType.Points
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });

    // 2.4*3 = 7.2 (should round down)
    const transaction: any = await createTransactionForRebateCriteria({
      rebateCriteriaId: rebateCriteria.id,
      amount: '12.23',
      userId: user.id,
      basePoints: 3
    });

    // 2.4*4 = 9.6 (should round up)
    const transaction2: any = await createTransactionForRebateCriteria({
      rebateCriteriaId: rebateCriteria.id,
      amount: '12.23',
      userId: user.id,
      basePoints: 4
    });

    await QualifyingStrategy.perform(transaction, mockKafkaProducer, logger);

    const rebate = await RebateRepository.last();
    expect(rebate.amount).to.eq('7.00');
    expect(rebate.userId).to.eq(transaction.userId);
    expect(rebate.accountTransactionId).to.eq(transaction.transactionId);

    expectToBeProcessed(transaction, TransactionStatus.RebateCreated);

    await QualifyingStrategy.perform(transaction2, mockKafkaProducer, logger);

    const rebate2 = await RebateRepository.last();
    expect(rebate2.amount).to.eq('10.00');
    expect(rebate2.userId).to.eq(transaction2.userId);
    expect(rebate2.accountTransactionId).to.eq(transaction2.transactionId);

    expectToBeProcessed(transaction2, TransactionStatus.RebateCreated);
  });

  it("does not issue a rebate worth nothing", async () => {
    const user = await createUser();

    const rebateCriteria = await createRebateCriteria({
      rewardCalculation: {
        operand: '0',
        operation: ArithmeticOperation.Addition,
        unit: RewardType.Dollars
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });

    const transaction: any = await createTransactionForRebateCriteria({
      rebateCriteriaId: rebateCriteria.id,
      amount: '12.23',
      userId: user.id
    }) as Partial<ITransactionForRebateCriteria>;

    await QualifyingStrategy.perform(transaction, mockKafkaProducer, logger);

    expect(logger.toString()).to
      .include('Rebate amount is zero, no rebate issued');

    expect(await RebateRepository.count()).to.eq(0);

    expectToBeProcessed(transaction, TransactionStatus.RebateNotDue);
  });

  it("doesnt issue for a blacklisted client", async () => {
    const user = await createUser({
      isBlacklisted: true
    });

    const rebateCriteria = await createRebateCriteria({
      rewardCalculation: {
        operand: '10',
        operation: ArithmeticOperation.Addition,
        unit: RewardType.Dollars
      },
      isRedeemable: true,
      hasBeenActivated: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });

    const transaction: ITransactionForRebateCriteria = await createTransactionForRebateCriteria({
      rebateCriteriaId: rebateCriteria.id,
      amount: '12.23',
      userId: user.id
    });

    await QualifyingStrategy.perform(transaction, mockKafkaProducer, logger);

    expectToBeProcessed(transaction, TransactionStatus.ClientBlacklisted);
  });

  async function expectToBeProcessed(
    model: ITransactionForRebateCriteria,
    status: TransactionStatus
  ) {
    const reloaded = await TransactionForRebateCriteriaRepository.findOrFail(model.id);
    expect(reloaded.processedAt).to.be.instanceOf(Date);
    expect(reloaded.status).to.eq(status);
  }
});
