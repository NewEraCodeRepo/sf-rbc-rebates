import { expect } from "chai";
import "mocha";
import * as sinon from 'sinon';
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { RebateRepository } from "../../app/database/repositories/rebate_repository";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionProcessing } from "../../app/transaction_processing/index";
import { createRebateCriteria } from "../fixtures/rebate_criteria";
import { createTransactionForRebateCriteria } from "../fixtures/transaction_for_rebate_criteria";
import { createRebate } from "../fixtures/rebate";
import { createUser } from "../fixtures/user";
import { requiresDatabase } from "../support/database";
import { TestLogger } from "../support/test_logger";
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";

describe("Validating fulfillments", () => {
    requiresDatabase();

    let initStub;
    let dispatchStub;

    beforeEach(() => {
        initStub = sinon.stub(RebateProducer.prototype, 'init');
        dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
    });

    afterEach(() => {
        initStub.restore();
        dispatchStub.restore();
    });

    it("validates a fulfillment that has no rebateId", async () => {
        // Log a transaction with $10 spent
        const transaction = await createTransactionForRebateCriteria ( {
            transactionId: "FULFILLMENT-1",
            processedAt: null,
            rebateId: null,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Fulfillment,
        });

        // Run transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is RebateIdNotFound
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();
        expect(lastTransaction.transactionId).to.eq(transaction.transactionId);
        expect(lastTransaction.rebateId).to.eq(null);
        expect(lastTransaction.status).to.eq(TransactionStatus.RebateIdNotFound);
    });

    it("validates a fulfillment that was used for another offer", async () => {
        // Log a rebate pending fulfillment
        const rebate = await createRebate ( {
            fulfilledTransactionId: "FULFILLMENT-1",
            status: TransactionStatus.PendingFulfillment,
        });

        // Log a fulfillment transaction
        await createTransactionForRebateCriteria ( {
          transactionId: "FULFILLMENT-1",
          processedAt: null,
          rebateId: rebate.id,
          status: TransactionStatus.Pending,
          transactionType: TransactionType.Fulfillment,
        });

        // Run transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is FulfilledTransUsedAlready
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.transactionId).to.eq(rebate.fulfilledTransactionId);
        expect(lastTransaction.rebateId).to.eq(rebate.id);
        expect(lastTransaction.status).to.eq(TransactionStatus.FulfilledTransUsedAlready);
    });

    it("validates a fulfillment for an unknown user", async () => {
        // Log a rebate pending fulfillment
        const rebate = await createRebate ( {
            status: TransactionStatus.PendingFulfillment,
        });

        // Log a fulfillment transaction
        const transaction = await createTransactionForRebateCriteria ( {
            userId: "USER-1",
            processedAt: null,
            rebateId: rebate.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Fulfillment,
        });

        // Run transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is CannotFindClient
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.rebateId).to.eq(rebate.id);
        expect(lastTransaction.userId).to.eq(transaction.userId);
        expect(lastTransaction.status).to.eq(TransactionStatus.CannotFindClient);
    });

    it("validates a fulfillment for unknown rebate", async () => {
        // Create a user
        const user = await createUser();

        // Log a fulfillment transaction
        const transaction = await createTransactionForRebateCriteria ( {
            userId: user.id,
            transactionId: "FULFILLMENT-1",
            processedAt: null,
            rebateId: "2",
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Fulfillment,
        });

        // Run transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is RebateIdNotFound
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.userId).to.eq(user.id);
        expect(lastTransaction.transactionId).to.eq(transaction.transactionId);
        expect(lastTransaction.rebateId).to.eq(transaction.rebateId);
        expect(lastTransaction.status).to.eq(TransactionStatus.RebateNotFound);
    });

    it("validates that fulfillment account is equal to rebate account", async () => {
        // Create a user
        const user = await createUser();

        // Log a rebate pending fulfillment
        const rebate = await createRebate ( {
            accountId: "ACCOUNT-1",
            userId: user.id,
            status: TransactionStatus.PendingFulfillment,
        });

        // Log a fulfillment transaction
        const transaction = await createTransactionForRebateCriteria ( {
            accountId: "ACCOUNT-2",
            userId: user.id,
            processedAt: null,
            rebateId: rebate.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Fulfillment,
        });

        // Run transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is FulfilledTransHasDiffAccount
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.userId).to.eq(user.id);
        expect(lastTransaction.accountId).to.eq(transaction.accountId);
        expect(lastTransaction.rebateId).to.eq(rebate.id);
        expect(lastTransaction.status).to.eq(TransactionStatus.FulfilledTransHasDiffAccount);
    });

    it("validates fulfillment amount is equal to rebate amount", async () => {
        // Create a user
        const user = await createUser();

        // Log a rebate pending fulfillment
        const rebate = await createRebate ( {
            accountId: "ACCOUNT-1",
            userId: user.id,
            amount: "10",
            status: TransactionStatus.PendingFulfillment,
        });

        // Log a fulfillment transaction
        const transaction = await createTransactionForRebateCriteria ( {
            accountId: "ACCOUNT-1",
            amount: "20.00",
            userId: user.id,
            processedAt: null,
            rebateId: rebate.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Fulfillment,
        });

        // Run the transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is FulfilledTransHasWrongAmount
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.userId).to.eq(user.id);
        expect(lastTransaction.amount).to.eq(transaction.amount);
        expect(lastTransaction.rebateId).to.eq(rebate.id);
        expect(lastTransaction.status).to.eq(TransactionStatus.FulfilledTransHasWrongAmount);
    });

    it("validates rebate is in pending status", async () => {
        // Create a user
        const user = await createUser();

        // Log a rebate pending fulfillment
        const rebate = await createRebate ( {
            accountId: "ACCOUNT-1",
            userId: user.id,
            amount: "10",
            status: TransactionStatus.FulfilledTransSuccessful,
        });

        // Log a fulfillment transaction
        const transaction = await createTransactionForRebateCriteria ( {
            accountId: "ACCOUNT-1",
            amount: "10",
            userId: user.id,
            processedAt: null,
            rebateId: rebate.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Fulfillment,
        });

        // Run the transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is RebateNotPending
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.userId).to.eq(user.id);
        expect(lastTransaction.rebateId).to.eq(transaction.rebateId);
        expect(lastTransaction.status).to.eq(TransactionStatus.RebateNotPending);
    });

    it("validates a legitimate fulfillment", async () => {
        // Create a user
        const user = await createUser({ id: "USER-1" });

        // Log a rebate pending fulfillment
        const rebate = await createRebate ( {
            id: "REBATE-1",
            accountId: "ACCOUNT-1",
            amount: "10.01",
            status: TransactionStatus.PendingFulfillment,
        });

        // Log a fulfillment transaction
        const transaction = await createTransactionForRebateCriteria ( {
            accountId: "ACCOUNT-1",
            amount: "10.01",
            userId: user.id,
            processedAt: null,
            rebateId: rebate.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Fulfillment,
            rebateCriteriaId: rebate.rebateCriteriaId
        });

        // create the rebate criteria record
        await createRebateCriteria({ id: rebate.rebateCriteriaId, descriptionForTesting: 'Testable' });

        // Run the transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the fulfillment status is FulfilledTransSuccessful
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.userId).to.eq(user.id);
        expect(lastTransaction.accountId).to.eq(transaction.accountId);
        expect(lastTransaction.rebateId).to.eq(rebate.id);
        expect(lastTransaction.status).to.eq(TransactionStatus.FulfilledTransSuccessful);

        // Assert that the rebate status is FulfilledTransSuccessful
        const lastRebate = await RebateRepository.last();

        expect(lastRebate.id).to.eq(rebate.id);
        expect(lastRebate.status).to.eq(TransactionStatus.FulfilledTransSuccessful);

        // Assert that the Kafka message was produced as expected
        expect(initStub.calledOnce).to.equal(true);
        expect(dispatchStub.calledOnce).to.equal(true);
        const dispatchCall = dispatchStub.args[0][0];
        expect(dispatchCall).to.not.be.undefined;
        expect(dispatchCall.status).to.equal(TransactionStatus.FulfilledTransSuccessful);
        expect(dispatchCall.fulfillmentTransaction).to.deep.equal(transaction);
    });
});
