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
import { TransactionType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { TransactionStatus } from 'datapipeline-schemas/rebateManagementObject';
import { ITransactionForRebateCriteria } from 'datapipeline-schemas/rebateManagementObject';
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";
import * as sinon from "sinon";

describe("Ensure transaction can only be used to redeem once", () => {
    requiresDatabase();

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

    it('prevents multiple rebates being issued for a single transaction', async () => {
        const rebateCriteria = await createRebateCriteria({
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

        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: customer.id,
            amount: '10',
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            processedAt: null
        });

        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: customer.id,
            transactionId: transactionToBeAccepted.transactionId,
            amount: '20',
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            processedAt: null
        });

        const logger = new TestLogger();
        await TransactionProcessing.perform({ logger });

        // Verify rebate has only been issued for the first transaction
        const rebates = await RebateRepository.findAll();
        expect(rebates.length).to.eq(1);

        const rebate = rebates[0];
        expect(rebate.amount).to.eq('5.00');
        expect(rebate.userId).to.eq(customer.id);

        // Verify transaction state
        await expectToBeProcessed(
            transactionToBeAccepted,
            TransactionStatus.RebateCreated
        );

        await expectToBeProcessed(
            transactionToBeRejected,
            TransactionStatus.QualifiedTransUsedAlready
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
