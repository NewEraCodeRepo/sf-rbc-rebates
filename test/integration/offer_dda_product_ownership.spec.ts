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

describe("Debit card product based redemption", () => {
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

    it('handles offer products configured to reject transactions by joint card holders', async () => {
        const productCode = "TEST_CODE_DDA";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.DDA,
            redeemableOwnershipType: [OwnershipType.Sole]
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

        // create debit card product for sole owner
        const debitCardProductSole = createDebitCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Sole
        });

        // create debit card product for joint user
        const debitCardProductJoint = createDebitCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Joint
        });

        // create sole user & assign relevant debit card products
        const soleUser = await createUser({
            debitCardProducts: [debitCardProductSole],
        });

        // create joint user & assign relevant debit card products
        const jointUser = await createUser({
            debitCardProducts: [debitCardProductJoint],
        });

        // create dda transaction for sole user
        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: soleUser.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        // create dda transaction for joint user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: jointUser.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for primary user to be accepted
        await expectToBeProcessed(
          transactionToBeAccepted,
          TransactionStatus.RebateCreated
        );

        // expect transaction for authorized user to be rejected
        await expectToBeProcessed(
          transactionToBeRejected,
          TransactionStatus.DebitCardOwnerNotAuthorized
        );

    });

    it('handles cases when a user has multiple accounts with one having a block on the card', async () => {
        const productCode = "TEST_CODE_DDA";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.DDA,
            redeemableOwnershipType: [OwnershipType.Primary, OwnershipType.CoApplicant]
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

        // create debit card product for primary owner
        const debitCardProductValid = createDebitCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary,
            accountId: 'ACCOUNT_1',
            isEligibleClientProduct: '1'
        });

        // create debit card product for authorized user
        const debitCardProductBlacklisted = createDebitCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary,
            accountId: 'ACCOUNT_2',
            isEligibleClientProduct: '0'
        });

        // create primary user & assign relevant debit card products
        const primaryUser = await createUser({
            debitCardProducts: [debitCardProductValid, debitCardProductBlacklisted]
        });

        // create dda transaction for primary user
        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            accountId: 'ACCOUNT_1',
            processedAt: null
        });

        // create dda transaction for authorized user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            accountId: 'ACCOUNT_2',
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for good card to be accepted
        await expectToBeProcessed(
          transactionToBeAccepted,
          TransactionStatus.RebateCreated
        );

        // expect transaction for blocked card to be rejected
        await expectToBeProcessed(
          transactionToBeRejected,
          TransactionStatus.ProductHasBlockCode
        );

    });

    it('handles cases when the account id used in the transaction doesnt match the users card account', async () => {
        const productCode = "TEST_CODE_DDA";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.DDA,
            redeemableOwnershipType: [OwnershipType.Primary, OwnershipType.CoApplicant]
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

        // create debit card product for primary owner
        const debitCardProductValid = createDebitCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary,
            accountId: 'ACCOUNT_1',
            isEligibleClientProduct: '1'
        });

        // create primary user & assign relevant debit card products
        const primaryUser = await createUser({
            debitCardProducts: [debitCardProductValid]
        });

        // create dda transaction for primary user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            accountId: 'ACCOUNT_NOT_ON_USER',
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for good card to be accepted
        await expectToBeProcessed(
          transactionToBeRejected,
          TransactionStatus.UserProductForOfferNotFound
        );

    });

    it('handles offer products configured to reject transactions by joint card holders', async () => {
        const productCode = "TEST_CODE_DDA";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.DDA,
            redeemableOwnershipType: [OwnershipType.Joint]
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

        // create debit card product for sole owner
        const debitCardProductSole = createDebitCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Sole
        });

        // create debit card product for joint user
        const debitCardProductJoint = createDebitCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Joint
        });

        // create sole user & assign relevant debit card products
        const soleUser = await createUser({
            debitCardProducts: [debitCardProductSole],
        });

        // create joint user & assign relevant debit card products
        const jointUser = await createUser({
            debitCardProducts: [debitCardProductJoint],
        });

        // create dda transaction for sole user
        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: jointUser.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        // create dda transaction for joint user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: soleUser.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for primary user to be accepted
        await expectToBeProcessed(
          transactionToBeAccepted,
          TransactionStatus.RebateCreated
        );

        // expect transaction for authorized user to be rejected
        await expectToBeProcessed(
          transactionToBeRejected,
          TransactionStatus.DebitCardOwnerNotAuthorized
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
