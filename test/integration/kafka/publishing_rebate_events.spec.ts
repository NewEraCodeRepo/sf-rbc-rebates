import { expect } from "chai";
import { requiresDatabase } from "../../support/database";
import { resetKafkaTopic, lastKafkaEvent, requiresKafka} from "../../support/kafka";
import { createTransactionForRebateCriteria } from "../../fixtures/transaction_for_rebate_criteria";
import { createUser } from "../../fixtures/user";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionProcessing } from "../../../app/transaction_processing/index";
import { createRebate } from "../../fixtures/rebate";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TestLogger } from "../../support/test_logger";
import {createRebateCriteria} from "../../fixtures/rebate_criteria";
import { ArithmeticOperation } from "../../../app/interfaces/arithmetic_operation";
import {QualifyingStrategy} from "../../../app/transaction_processing/qualifying_strategy";
import { MockKafkaProducer } from "../../support/kafka/mock_producer";

describe("Rebate event notification @kafka", () => {

  requiresDatabase();
  requiresKafka();

  let logger;
  let mockKafkaProducer;

  beforeEach(() => {
    logger = new TestLogger();
    mockKafkaProducer = new MockKafkaProducer();
  });

  it("dispatches when a rebate is fulfilled and pending", async () => {

      try {
        await resetKafkaTopic("rebates_test");

        // Create linked client, rebate, and rebate criteria
        await createUser({id: 'Joe'});

        await createRebate({
          id: '10',
          accountId: 'ACCOUNT-10',
          userId: 'Joe',
          amount: '24.12',
          rewardType: RewardType.Dollars,
          status: TransactionStatus.PendingFulfillment
        });

        await createTransactionForRebateCriteria({
          transactionId: 'TRANSACTION-10',
          rebateId: '10',
          accountId: 'ACCOUNT-10',
          userId: 'Joe',
          amount: '24.12',
          basePoints: 0,
          transactionType: TransactionType.Fulfillment,
          processedAt: null
        });

        // Process fulfillment transactions
        await TransactionProcessing.perform({logger});

        const getFirstLastEvent = await lastKafkaEvent();

        // Confirm received a fulfilled rebate event
        expect(getFirstLastEvent.topic).to.eq('rebates_test');
        expect(getFirstLastEvent.payload.rebate).to.include({
          userId: 'Joe',
          amount: '24.12',
          fulfilledTransactionId: 'TRANSACTION-10',
          status: TransactionStatus.FulfilledTransSuccessful
        });

        await createUser({id: 'Bob'});

        await createRebateCriteria({
          id: "CRITERIA-50",
          rewardCalculation: {
            operand: '5',
            operation: ArithmeticOperation.Addition,
            unit: RewardType.Dollars
          },
          requiresCustomerToBeLinked: false,
          requiresCustomerToBeTargeted: false
        });

        const transaction: any = await createTransactionForRebateCriteria({
          rebateCriteriaId: "CRITERIA-50",
          transactionId: 'TRANSACTION-50',
          rebateId: '50',
          accountId: 'ACCOUNT-50',
          userId: 'Bob'
        });

        // Process qualifying transactions
        await QualifyingStrategy.perform(transaction, mockKafkaProducer, logger);

        const getLastEvent = await lastKafkaEvent();

        // Confirm received a pending rebate event
        expect(getLastEvent.topic).to.eq('rebates_test');
        expect(getLastEvent.payload.rebate).to.include({
          userId: 'Bob',
          accountId: 'ACCOUNT-50',
          accountTransactionId: 'TRANSACTION-50',
          status: TransactionStatus.PendingExtraction
        });

      } catch (e) {
        logger.error(e);
      }

    });

});
