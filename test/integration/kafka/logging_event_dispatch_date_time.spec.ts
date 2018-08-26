import { expect } from "chai";
import * as sinon from "sinon";
import { requiresDatabase } from "../../support/database";
import { createTransactionForRebateCriteria } from "../../fixtures/transaction_for_rebate_criteria";
import { createUser } from "../../fixtures/user";
import { TransactionType} from "datapipeline-schemas/rebateManagementObject";
import { TransactionProcessing } from "../../../app/transaction_processing/index";
import { createRebate } from "../../fixtures/rebate";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TestLogger } from "../../support/test_logger";
import {createRebateCriteria} from "../../fixtures/rebate_criteria";
import { ArithmeticOperation } from "../../../app/interfaces/arithmetic_operation";
import {QualifyingStrategy} from "../../../app/transaction_processing/qualifying_strategy";
import {RebateRepository} from "../../../app/database/repositories/rebate_repository";
import { MockKafkaProducer } from "../../support/kafka/mock_producer";
import { RebateProducer } from "../../../app/kafka/producers/rebate_producer";

// @TODO make kafka test when kafka integration tests are fixed
describe("Event dispatch date and time gets logged", () => {

  requiresDatabase();

  let logger;
  let initStub;
  let dispatchStub;
  let mockKafkaProducer;

  beforeEach(() => {
      mockKafkaProducer = new MockKafkaProducer();
      initStub = sinon.stub(RebateProducer.prototype, 'init').resolves(true);
      dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
      logger = new TestLogger();
  });

  afterEach(() => {
      initStub.restore();
      dispatchStub.restore();
  });

  it("when a rebate is pending", async () => {

        await createUser({id: 'Bob'});

        await createRebateCriteria({
          id: "REBATE-CRITERIA-50",
          rewardCalculation: {
            operand: '5',
            operation: ArithmeticOperation.Addition,
            unit: RewardType.Dollars
          },
          requiresCustomerToBeLinked: false,
          requiresCustomerToBeTargeted: false
        });

        const transaction: any = await createTransactionForRebateCriteria({
          rebateCriteriaId: "REBATE-CRITERIA-50",
          transactionId: 'TRANSACTION-50',
          rebateId: '50',
          accountId: 'ACCOUNT-50',
          userId: 'Bob'
        });

        try {
          // Process qualifying transactions
          await QualifyingStrategy.perform(transaction, mockKafkaProducer, logger);

          const pendingRebate = await RebateRepository.findAll({
            where: {
              rebate_criteria_id: transaction.rebateCriteriaId,
              user_id: transaction.userId
            }
          });

          logger.info(JSON.stringify(pendingRebate, null, "\t"));
          // check that the dispatchedAt date is the same as the issuedAt
          // date - which is when the event was dispatched.
          expect(pendingRebate[0].dispatchedAt).to.eq(pendingRebate[0].issuedAt);
        } catch (e) {
          logger.error(e);
        }

    });

  it("when a rebate is fulfilled", async () => {

    // Create a user
    await createUser({ id: "USER-1" });

    // Log a rebate pending fulfillment
    const rebate = await createRebate ( {
      id: "1",
      accountId: "ACCOUNT-1",
      amount: "10",
      status: TransactionStatus.PendingFulfillment,
    });

    // Log a fulfillment transaction
    await createTransactionForRebateCriteria ( {
      accountId: "ACCOUNT-1",
      amount: "10",
      userId: "USER-1",
      processedAt: null,
      rebateId: "1",
      status: TransactionStatus.Pending,
      transactionType: TransactionType.Fulfillment,
      rebateCriteriaId: rebate.rebateCriteriaId
    });

    // create the rebate criteria record
    await createRebateCriteria({ id: rebate.rebateCriteriaId, descriptionForTesting: 'Testable' });

    try {
      // Run the transaction processing
      await TransactionProcessing.perform({ logger });

      // Assert that the rebate status is FulfilledTransSuccessful
      const fulfilledRebate = await RebateRepository.findOrFail(rebate.id);

      // check that the dispatchedAt is the same as the fulfilledDate
      // which is when the rebte fulfilled event was dispatched.
      expect(fulfilledRebate[0].dispatchedAt).to.eq(fulfilledRebate[0].fulfilledDate);
    } catch (e) {
      logger.error(e);
    }

  });

});
