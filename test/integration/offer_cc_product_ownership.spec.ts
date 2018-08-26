import { expect } from "chai";
import { requiresDatabase } from '../support/database';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { createTransactionForRebateCriteria } from '../fixtures/transaction_for_rebate_criteria';
import { createUser } from '../fixtures/user';
import {
    createEligibleProductList,
    createCreditCardProduct,
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
import * as moment from "moment-timezone";
import {OwnershipType} from "datapipeline-schemas/sharedData";
import {ProductType} from "datapipeline-schemas/userObject";
import {OfferType} from "datapipeline-schemas/salesforceObject";
import { createUserLedger } from "../fixtures/user_ledger";

describe("Credit card product based redemption", () => {
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

    it('handles offer products configured to reject transactions by authorized card holders', async () => {
        const productCode = "TEST_CODE_CC";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.CreditCard,
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

        // create credit card product for primary owner
        const creditCardProductPrimary = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary
        });

        // create credit card product for authorized user
        const creditCardProductAuthorized = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.AuthorizedUser
        });

        // create primary user & assign relevant credit card products
        const primaryUser = await createUser({
            creditCardProducts: [creditCardProductPrimary],
        });

        // create authorized user & assign relevant credit card products
        const authorizedUser = await createUser({
            creditCardProducts: [creditCardProductAuthorized],
        });

        // create cc transaction for primary user
        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        // create cc transaction for authorized user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: authorizedUser.id,
            cardType: CardType.CreditCard,
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
          TransactionStatus.CreditCardOwnerNotAuthorized
        );

    });

    it('handles cases when the account id used in the transaction doesnt match the users card account', async () => {
        const productCode = "TEST_CODE_CC";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.CreditCard,
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

        // create credit card product for primary owner
        const creditCardProductValid = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary,
            accountId: 'ACCOUNT_1',
            isEligibleClientProduct: '1'
        });

        // create primary user & assign relevant credit card products
        const primaryUser = await createUser({
            creditCardProducts: [creditCardProductValid]
        });

        // create credit transaction for primary user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CreditCard,
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

    it('handles cases when a user has multiple accounts and one card has a blacklist', async () => {
        const productCode = "TEST_CODE_CC";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.CreditCard,
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

        // create credit card product for primary owner
        const creditCardProductValid = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary,
            accountId: 'ACCOUNT_1',
            isEligibleClientProduct: '1'
        });

        // create credit card product for authorized user
        const creditCardProductBlacklisted = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary,
            accountId: 'ACCOUNT_2',
            isEligibleClientProduct: '0'
        });

        // create primary user & assign relevant credit card products
        const primaryUser = await createUser({
            creditCardProducts: [creditCardProductValid, creditCardProductBlacklisted]
        });

        // create cc transaction for primary user
        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            accountId: 'ACCOUNT_1',
            processedAt: null
        });

        // create cc transaction for authorized user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CreditCard,
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

    it('handles offer products configured to reject transactions by co-applicant card holders', async () => {
        const productCode = "TEST_CC_CODE";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.CreditCard,
            redeemableOwnershipType: [OwnershipType.Primary, OwnershipType.AuthorizedUser]
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

        // create credit card product for primary owner
        const creditCardProductPrimary = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary
        });

        // create credit card product for co-applicant user
        const creditCardProductCoApplicant = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.CoApplicant
        });

        // create primary user & assign relevant credit card products
        const primaryUser = await createUser({
            creditCardProducts: [creditCardProductPrimary],
        });

        // create co-applicant user & assign relevant credit card products
        const coApplicantUser = await createUser({
            creditCardProducts: [creditCardProductCoApplicant],
        });

        // create cc transaction for primary user
        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        // create cc transaction for co-applicant user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: coApplicantUser.id,
            cardType: CardType.CreditCard,
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
          TransactionStatus.CreditCardOwnerNotAuthorized
        );

    });

    it('handles offer products configured to reject transactions by primary card holders', async () => {
        const productCode = "TEST_CC_CODE";

        // create eligible product list
        const eligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.CreditCard,
            redeemableOwnershipType: [OwnershipType.CoApplicant, OwnershipType.AuthorizedUser]
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

        // create credit card product for co-applicant owner
        const creditCardProductCoApplicant = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.CoApplicant
        });

        // create credit card product for primary user
        const creditCardProductPrimary = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary
        });

        // create co-applicant user & assign relevant credit card products
        const coApplicantUser = await createUser({
            creditCardProducts: [creditCardProductCoApplicant],
        });

        // create primary user & assign relevant credit card products
        const primaryUser = await createUser({
            creditCardProducts: [creditCardProductPrimary],
        });

        // create cc transaction for co-applicant user
        const transactionToBeAccepted = await createTransactionForRebateCriteria({
            userId: coApplicantUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        // create cc transaction for primary user
        const transactionToBeRejected = await createTransactionForRebateCriteria({
            userId: primaryUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for co-applicant user to be accepted
        await expectToBeProcessed(
          transactionToBeAccepted,
          TransactionStatus.RebateCreated
        );

        // expect transaction for primary user to be rejected
        await expectToBeProcessed(
          transactionToBeRejected,
          TransactionStatus.CreditCardOwnerNotAuthorized
        );

    });

    it("issues for an Auth user if Primary is Linked", async () => {

        const productCode = "TEST_CODE_CC";
        const bothProductCode = "TEST_CODE_CC_BOTH";

        // create eligible product list for presentable to just Primary
        const primaryEligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: productCode,
            productTypeExternal: ProductType.CreditCard,
            redeemableOwnershipType: [OwnershipType.Primary, OwnershipType.AuthorizedUser],
            presentableOwnershipType: [OwnershipType.Primary]
        });

        // create eligible product list for both primary and auth users
        const bothEligibleProductList = await createEligibleProductList({
            productCode,
            productCodeExternal: bothProductCode,
            productTypeExternal: ProductType.CreditCard,
            redeemableOwnershipType: [OwnershipType.Primary, OwnershipType.AuthorizedUser],
            presentableOwnershipType: [OwnershipType.Primary, OwnershipType.AuthorizedUser]
        });

        // create linked offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: true,
            requiresCustomerToBeTargeted: false,
            eligibleProducts: primaryEligibleProductList,
            redemptionBasedOn: OfferType.ProductOwnerShipBased
        });

        // create linked offer & assign eligible product list for both presentment options
        const rebateCriteriaBothPresent = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: true,
            requiresCustomerToBeTargeted: false,
            eligibleProducts: bothEligibleProductList,
            redemptionBasedOn: OfferType.ProductOwnerShipBased
        });

        // create credit card product for primary owner
        const creditCardProductPrimary = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Primary
        });

        // create primary user, assign relevant credit card products, assign relevant linked offers
        const primaryUser = await createUser({
            creditCardProducts: [creditCardProductPrimary],
            linkedOfferIds: [rebateCriteria.id, rebateCriteriaBothPresent.id]
        });

        await createUserLedger({
            userId: primaryUser.id,
            linkedOffers: [rebateCriteria.id, rebateCriteriaBothPresent.id],
            isEnrolledToMyOffers: true,
            updateTimestamp: moment.utc(new Date()).subtract(3, 'days').toDate()
        });

        // create credit card product for authorized user
        const creditCardProductAuthorized = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.AuthorizedUser,
            primaryAccountHashSRF: primaryUser.id
        });

        // create "both" credit card product for authorized user
        const creditCardProductAuthorizedBoth = createCreditCardProduct({
            code: bothProductCode,
            ownershipType: OwnershipType.AuthorizedUser,
            primaryAccountHashSRF: primaryUser.id
        });

        // create authorized user & assign relevant credit card products
        const authorizedUser = await createUser({
            creditCardProducts: [creditCardProductAuthorized, creditCardProductAuthorizedBoth]
        });

        // create credit card product for Joint user
        const creditCardProductJoint = createCreditCardProduct({
            code: productCode,
            ownershipType: OwnershipType.Joint,
            primaryAccountHashSRF: primaryUser.id
        });

        // create authorized user & assign relevant credit card products
        const jointUser = await createUser({
            creditCardProducts: [creditCardProductJoint]
        });

        // create cc transaction for authorized user
        const authUserTransaction = await createTransactionForRebateCriteria({
            userId: authorizedUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        // create cc transaction for auth user on the one with both presentable
        const authUserTransactionOnBothPresentable = await createTransactionForRebateCriteria({
            userId: authorizedUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteriaBothPresent.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: bothProductCode,
            processedAt: null
        });

        // create cc transaction for joint user
        const jointUserTransaction = await createTransactionForRebateCriteria({
            userId: jointUser.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            productCodeExternal: productCode,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for auth user to be accepted
        await expectToBeProcessed(
            authUserTransaction,
            TransactionStatus.RebateCreated
        );

        // expect transaction for joint user to be rejected
        await expectToBeProcessed(
            jointUserTransaction,
            TransactionStatus.ClientIsNotLinked
        );

        // expect transaction for "both" to be rejected
        await expectToBeProcessed(
            authUserTransactionOnBothPresentable,
            TransactionStatus.ClientIsNotLinked
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
