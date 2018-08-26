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
import * as moment from "moment-timezone";
import * as sinon from "sinon";
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";

describe("Redemption period rebates", () => {
    requiresDatabase();
    const now = new Date();

    let initStub;
    let dispatchStub;

    beforeEach(() => {
        initStub = sinon.stub(RebateProducer.prototype, 'init').resolves(true);
        dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
    });

    afterEach(() => {
        initStub.restore();
        dispatchStub.restore();
    });

    it('only issues a rebate if offer is within redemption period', async () => {
        const rebateCriteriaInsidePeriod = await createRebateCriteria({
            validFromDate: moment.utc().subtract(1, "days").toDate(),
            validToDate: moment.utc().add(60, "days").toDate(),
            redemptionPeriodInDays: 10,
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            rewardCalculation: {
                operation: ArithmeticOperation.Addition,
                operand: '-5',
                unit: RewardType.Dollars
            }
        });

        const rebateCriteriaOutsidePeriod = await createRebateCriteria({
            validFromDate: moment(now).add(-10, "days"),
            validToDate: moment(now).add(-9, "days"),
            redemptionPeriodInDays: 1,
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            rewardCalculation: {
                operation: ArithmeticOperation.Addition,
                operand: '-5',
                unit: RewardType.Dollars
            }
        });

        const customer = await createUser();

        const transactionForOfferInsidePeriod = await createTransactionForRebateCriteria({
            userId: customer.id,
            amount: '10',
            rebateCriteriaId: rebateCriteriaInsidePeriod.id,
            transactionType: TransactionType.Qualifying,
            transactionDate: moment.utc().add(4, "days").toDate(),
            processedAt: null
        });

        const transactionForOfferOutsidePeriod = await createTransactionForRebateCriteria({
            userId: customer.id,
            amount: '20',
            rebateCriteriaId: rebateCriteriaOutsidePeriod.id,
            transactionType: TransactionType.Qualifying,
            processedAt: null
        });

        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Verify rebate has only been issued for the offer within redemption period
        const rebates = await RebateRepository.findAll();
        expect(rebates.length).to.eq(1);

        const rebate = rebates[0];
        expect(rebate.amount).to.eq('5.00');
        expect(rebate.rebateCriteriaId).to.eq(rebateCriteriaInsidePeriod.id);

        // Verify transaction state
        await expectToBeProcessed(
            transactionForOfferInsidePeriod,
            TransactionStatus.RebateCreated
        );

        await expectToBeProcessed(
            transactionForOfferOutsidePeriod,
            TransactionStatus.OfferNotWithinRedemptionPeriod
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
