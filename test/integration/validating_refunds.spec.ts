import { expect } from "chai";
import "mocha";
import * as moment from "moment-timezone";
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionProcessing } from "../../app/transaction_processing/index";
import { createTransactionForRebateCriteria } from "../fixtures/transaction_for_rebate_criteria";
import { createRebate } from "../fixtures/rebate";
import { createRebateCriteria } from "../fixtures/rebate_criteria";
import { requiresDatabase } from "../support/database";
import { TestLogger } from "../support/test_logger";
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { RewardType } from "datapipeline-schemas/rebateManagementObject";
import * as sinon from 'sinon';
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";

describe("Validating refunds", () => {
    requiresDatabase();
    const now = new Date();

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

    it("validates a refund for an offer that's tracking refunds", async () => {
        // Create a rebate criteria that is tracking refunds
       const rebateCriteria = await createRebateCriteria({
            id: "OFFER-1",
            rewardCalculation: {
                operand: "10",
                operation: ArithmeticOperation.Addition,
                unit: RewardType.Dollars
            },
            isRedeemable: true,
            refundPeriodInDays: 30,
            validFromDate: moment(now).add(-10, "days"),
            validToDate: moment(now).add(-9, "days"),
            hasBeenActivated: true,
        });

        // Create a fulfilled rebate for userId, OfferId
       await createRebate({
            userId: "USER-1",
            rebateCriteriaId: rebateCriteria.id,
            status: TransactionStatus.FulfilledTransSuccessful
        });

        // Log a refund transaction
       await createTransactionForRebateCriteria({
            accountId: "ACCOUNT-1",
            amount: "10",
            transactionId: "REFUND-1",
            userId: "USER-1",
            processedAt: null,
            rebateCriteriaId: rebateCriteria.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Refund,
        });

        // Run the transaction processing
       const logger = new TestLogger();
       await TransactionProcessing.perform({ logger });

        // Assert that the refund status is RefundTrackedForReporting
       const lastTransaction = await TransactionForRebateCriteriaRepository.last();

       expect(lastTransaction.transactionId).to.eq("REFUND-1");
       expect(lastTransaction.amount).to.eq("10.00");
       expect(lastTransaction.rebateCriteriaId).to.eq("OFFER-1");
       expect(lastTransaction.status).to.eq(TransactionStatus.RefundTrackedForReporting);
    });

    it("validates a refund for an offer that's not tracking refunds", async () => {
        // Create a rebate criteria that is not tracking refunds
      const rebateCriteria = await createRebateCriteria({
            id: "OFFER-2",
            rewardCalculation: {
                operand: "10",
                operation: ArithmeticOperation.Addition,
                unit: RewardType.Dollars
            },
            isRedeemable: true,
            refundPeriodInDays: 30,
            validFromDate: moment(now).add(-10, "days"),
            validToDate: moment(now).add(-9, "days"),
            hasBeenActivated: false,
        });

        // Create a fulfilled rebate for userId, OfferId
      await createRebate({
            userId: "USER-2",
            rebateCriteriaId: rebateCriteria.id,
            status: TransactionStatus.FulfilledTransSuccessful
        });

        // Log a refund transaction
      await createTransactionForRebateCriteria ( {
            accountId: "ACCOUNT-2",
            amount: "10",
            transactionId: "REFUND-2",
            userId: "USER-2",
            processedAt: null,
            rebateCriteriaId: rebateCriteria.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Refund,
        });

        // Run the transaction processing
      const logger = new TestLogger();
      await TransactionProcessing.perform({ logger });

        // Assert that the refund status is RefundNotTrackedForReporting
      const lastTransaction = await TransactionForRebateCriteriaRepository.last();

      expect(lastTransaction.transactionId).to.eq("REFUND-2");
      expect(lastTransaction.amount).to.eq("10.00");
      expect(lastTransaction.rebateCriteriaId).to.eq("OFFER-2");
      expect(lastTransaction.status).to.eq(TransactionStatus.RefundNotTrackedForReporting);
    });

    it("validates a refund for an unknown offer", async () => {
        // Log a refund transaction
         await createTransactionForRebateCriteria({
            accountId: "ACCOUNT-3",
            amount: "5",
            transactionId: "REFUND-3",
            processedAt: null,
            rebateCriteriaId: "UNKNOWN-OFFER",
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Refund,
        });

        // Run the transaction processing
         const logger = new TestLogger();
         await TransactionProcessing.perform({ logger });

        // Assert that the refund status is OfferNotFound
         const lastTransaction = await TransactionForRebateCriteriaRepository.last();

         expect(lastTransaction.transactionId).to.eq("REFUND-3");
         expect(lastTransaction.amount).to.eq("5.00");
         expect(lastTransaction.rebateCriteriaId).to.eq("UNKNOWN-OFFER");
         expect(lastTransaction.status).to.eq(TransactionStatus.OfferNotFound);
    });

    it("validates a refund if user hasn't received a rebate for offer", async () => {
        // Create a rebate criteria that is tracking refunds
        const rebateCriteria = await createRebateCriteria({
            id: "OFFER-4",
            rewardCalculation: {
                operand: "10",
                operation: ArithmeticOperation.Addition,
                unit: RewardType.Dollars
            },
            isRedeemable: true,
            refundPeriodInDays: 30,
            validFromDate: moment(now).add(-10, "days"),
            validToDate: moment(now).add(-9, "days"),
            hasBeenActivated: true,
        });

        // Log a refund transaction
        await createTransactionForRebateCriteria({
            accountId: "ACCOUNT-4",
            amount: "10",
            transactionId: "REFUND-4",
            userId: "USER-4",
            processedAt: null,
            rebateCriteriaId: rebateCriteria.id,
            status: TransactionStatus.Pending,
            transactionType: TransactionType.Refund,
        });

        // Run transaction processing
        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Assert that the refund status is RebateNotFound
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        expect(lastTransaction.transactionId).to.eq("REFUND-4");
        expect(lastTransaction.amount).to.eq("10.00");
        expect(lastTransaction.rebateCriteriaId).to.eq("OFFER-4");
        expect(lastTransaction.status).to.eq(TransactionStatus.RebateNotFound);
    });
});
