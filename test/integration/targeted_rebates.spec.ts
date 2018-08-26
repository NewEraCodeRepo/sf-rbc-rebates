import { expect } from "chai";
import { requiresDatabase } from '../support/database';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { createTransactionForRebateCriteria } from '../fixtures/transaction_for_rebate_criteria';
import { createUser } from '../fixtures/user';
import { RewardType } from 'datapipeline-schemas/rebateManagementObject';
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { TransactionProcessing } from '../../app/transaction_processing';
import { TestLogger } from '../support/test_logger';
import { RebateRepository } from '../../app/database/repositories/rebate_repository';
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import {createUserLedger} from "../fixtures/user_ledger";
import * as moment from "moment-timezone";
import * as sinon from "sinon";
import {UserLedgerRepository} from "../../app/database/repositories/user_ledger_repository";
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";

describe("Targeted rebates only issue for customers", () => {
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

    it('who targeted to the offer', async () => {
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: true,
            rewardCalculation: {
                operation: ArithmeticOperation.Addition,
                operand: '-5',
                unit: RewardType.Dollars
            }
        });

        const customerWithoutTarget = await createUser({ targetedOfferIds: [] });

        const customerWithTarget = await createUser({
            targetedOfferIds: [rebateCriteria.id]
        });

        // create user ledgers
        await createUserLedger({
            userId: customerWithoutTarget.id,
            targetedOffers: [],
            isEnrolledToMyOffers: true
        });

        await createUserLedger({
            userId: customerWithTarget.id,
            targetedOffers: [rebateCriteria.id],
            isEnrolledToMyOffers: true
        });

        const transactionForCustomerWithoutTarget = await createTransactionForRebateCriteria({
            userId: customerWithoutTarget.id,
            amount: '10',
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            processedAt: null
        });

        const transactionForCustomerWithTarget = await createTransactionForRebateCriteria({
            userId: customerWithTarget.id,
            amount: '20',
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // Verify rebate has only been issued for the targeted account
        const rebates = await RebateRepository.findAll();
        expect(rebates.length).to.eq(1);

        const rebate = rebates[0];
        expect(rebate.amount).to.eq('5.00');
        expect(rebate.userId).to.eq(customerWithTarget.id);

        // Verify transaction state
        await expectToBeProcessed(
          transactionForCustomerWithTarget,
          TransactionStatus.RebateCreated
        );

        await expectToBeProcessed(
          transactionForCustomerWithoutTarget,
          TransactionStatus.ClientIsNotTargeted
        );
    });

    it('who have been targeted to the offer by the transaction date', async () => {
        await createRebateCriteria({
            id: "OFFER_1",
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: true,
            validFromDate: moment.utc(now).subtract(20, "days").toDate(),
            validToDate: moment.utc(now).add(60, "days").toDate(),
            redemptionPeriodInDays: 40
        });

        await createRebateCriteria({
            id: "OFFER_2",
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: true,
            validFromDate: moment.utc(now).subtract(20, "days").toDate(),
            validToDate: moment.utc(now).add(60, "days").toDate(),
            redemptionPeriodInDays: 40
        });

        // create customer
        await createUser({
            id: '10',
            targetedOfferIds: ["OFFER_1", "OFFER_2"],
        });

        // create link three days ago
        await createUserLedger({
            userId: '10',
            targetedOffers: ["OFFER_1"],
            isEnrolledToMyOffers: true,
            updateTimestamp: moment.utc(now).subtract(3, "days").toDate()
        });

        // create same day link history
        await createUserLedger({
            userId: '10',
            targetedOffers: ["OFFER_1", "OFFER_2"],
            isEnrolledToMyOffers: true,
            updateTimestamp: moment.utc(now).toDate()
        });

        // If a client is on the target list for a Saks offer on Jan 2 and makes a qualifying transaction on Jan 3, they should receive the Rebate.
        const successfullTransactionOne = await createTransactionForRebateCriteria({
            userId: '10',
            amount: '10',
            rebateCriteriaId: "OFFER_1",
            transactionType: TransactionType.Qualifying,
            processedAt: null,
            transactionDate: moment(now).add(1, "days").toDate(),
        });

        // If a client is on the target list for a Saks offer on Jan 3 and makes a qualifying transaction on Jan 3, they should receive the rebate.
        const successfullTransactionTwo = await createTransactionForRebateCriteria({
            userId: '10',
            amount: '10',
            rebateCriteriaId: "OFFER_2",
            transactionType: TransactionType.Qualifying,
            processedAt: null,
            transactionDate: moment(now).toDate()
        });

        // If client makes a purchase at Saks on Jan 2 is not on the target list for the Offer until Jan 3, they should not receive the Rebate
        const failureTransactionDate = await createTransactionForRebateCriteria({
            userId: '10',
            amount: '10',
            rebateCriteriaId: "OFFER_1",
            transactionType: TransactionType.Qualifying,
            processedAt: null,
            transactionDate: moment(now).subtract(4, "days").toDate(),
        });

        await TransactionProcessing.perform({ logger });

        // Verify transaction state
        await expectToBeProcessed(
          successfullTransactionOne,
          TransactionStatus.RebateCreated
        );

        await expectToBeProcessed(
          successfullTransactionTwo,
          TransactionStatus.RebateCreated
        );

        await expectToBeProcessed(
          failureTransactionDate,
          TransactionStatus.ClientIsNotTargeted
        );
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
