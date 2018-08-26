import { expect } from "chai";
import { requiresDatabase } from '../support/database';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { createTransactionForRebateCriteria } from '../fixtures/transaction_for_rebate_criteria';
import { createUser } from '../fixtures/user';
import {
    createEligibleProductList,
    createDebitCardProduct,
} from "../fixtures/product_based";
import { CardType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionProcessing } from '../../app/transaction_processing';
import { TestLogger } from '../support/test_logger';
import { TransactionType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { TransactionStatus } from 'datapipeline-schemas/rebateManagementObject';
import { ITransactionForRebateCriteria } from 'datapipeline-schemas/rebateManagementObject';
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";
import * as sinon from "sinon";
import {OwnershipType} from "datapipeline-schemas/sharedData";
import {ProductType} from "datapipeline-schemas/userObject";
import {OfferType} from "datapipeline-schemas/salesforceObject";

describe("Check product used for transaction exists", () => {
    requiresDatabase();

    let logger;
    let initStub;
    let dispatchStub;

    beforeEach(() => {
        logger = new TestLogger();
        initStub = sinon.stub(RebateProducer.prototype, 'init').resolves(true);
        dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
    });

    afterEach(() => {
        initStub.restore();
        dispatchStub.restore();
    });

    it('accepts transaction if system can find card used by client', async () => {
        const productCode = "TEST_CODE_DDA";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.DDA,
            redeemableOwnershipType: [OwnershipType.Sole, OwnershipType.Joint]
        });

        // create offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            eligibleProducts: eligibleProductList,
            redemptionBasedOn: OfferType.ProductOwnerShipBased
        });

        // create product for user
        const debitCardProduct = createDebitCardProduct({
            code: "TEST_CODE_DDA",
            ownershipType: OwnershipType.Sole
        });

        // create user & assign relevant card products
        const user = await createUser({
            debitCardProducts: [debitCardProduct],
        });

        // create transaction for user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: user.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for user to be rejected
        await expectToBeProcessed(
          transactionToBeRejected,
          TransactionStatus.RebateCreated
        );
    });

    it.skip('rejects transaction if system cannot find card used by client', async () => {
        const productCode = "TEST_CODE_DDA";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.DDA,
            redeemableOwnershipType: [OwnershipType.Sole, OwnershipType.Joint]
        });

        // create offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            eligibleProducts: eligibleProductList,
            redemptionBasedOn: OfferType.ProductOwnerShipBased
        });

        // create debit card product for user
        const debitCardProduct = createDebitCardProduct({
            code: "TEST_CODE_DDA_FAIL",
            ownershipType: OwnershipType.Sole
        });

        // create user & assign relevant debit card products
        const user = await createUser({
            debitCardProducts: [debitCardProduct],
        });

        // create dda transaction for user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: user.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for user to be rejected
        await expectToBeProcessed(
          transactionToBeRejected,
          TransactionStatus.UserProductForOfferNotFound
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
