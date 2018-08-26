import { expect } from "chai";
import { requiresDatabase } from '../support/database';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { createTransactionForRebateCriteria } from '../fixtures/transaction_for_rebate_criteria';
import { createUser } from '../fixtures/user';
import { createOptInFileOffer } from "../fixtures/product_based";
import { CardType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionProcessing } from '../../app/transaction_processing';
import { TestLogger } from '../support/test_logger';
import { TransactionType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionForRebateCriteriaRepository } from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { TransactionStatus } from 'datapipeline-schemas/rebateManagementObject';
import { ITransactionForRebateCriteria } from 'datapipeline-schemas/rebateManagementObject';
import { RebateProducer } from "../../app/kafka/producers/rebate_producer";
import * as sinon from "sinon";
import { ProductType } from "datapipeline-schemas/userObject";
import { OfferType } from "datapipeline-schemas/salesforceObject";

describe("Credit card pre-loaded opt-in file verification", () => {
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

    it('accepts credit card transaction if customer_id & account_id in opt-in file', async () => {
        const tsysCustomerId = "TEST_TSYS_CUST_ID";
        const tsysAccountId = "A_TEST_ACCOUNT";

        // create offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            redemptionBasedOn: OfferType.PreLoadedOptInFile
        });

        const optInFileOffer = createOptInFileOffer({
            type: ProductType.CreditCard,
            offers: [rebateCriteria.id],
            tsysCustomerId,
            tsysAccountId
        });

        // create user & assign relevant opt-in data
        const user = await createUser({
            optInFileOffers: [optInFileOffer],
        });

        // create cc transaction for user
        const transaction = await createTransactionForRebateCriteria({
            userId: user.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            tsysCustomerId,
            accountId: tsysAccountId,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for user to be accepted
        await expectToBeProcessed(
          transaction,
          TransactionStatus.RebateCreated
        );
    });

    it('rejects credit card transaction if customer_id & account_id not in opt-in file', async () => {
        const tsysCustomerId = "TEST_TSYS_CUST_ID";
        const tsysAccountId = "A_TEST_ACCOUNT";
        const tsysAccountIdFail = "TEST_TSYS_ACCT_ID_FAIL";

        // create offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            redemptionBasedOn: OfferType.PreLoadedOptInFile
        });

        const optInFileOffer = createOptInFileOffer({
            type: ProductType.CreditCard,
            offers: [rebateCriteria.id],
            tsysCustomerId,
            tsysAccountId: tsysAccountIdFail
        });

        // create user & assign relevant opt-in data
        const user = await createUser({
            optInFileOffers: [optInFileOffer],
        });

        // create cc transaction for user
        const transaction = await createTransactionForRebateCriteria({
            userId: user.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            tsysCustomerId,
            accountId: tsysAccountId,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for user to be rejected
        await expectToBeProcessed(
          transaction,
          TransactionStatus.ClientNotInOptInFile
        );
    });

    it('accepts transaction if offer is targeted and client is not in target list but is in opt-in file', async () => {
        const tsysCustomerId = "TEST_TSYS_CUST_ID";
        const tsysAccountId = "A_TEST_ACCOUNT";

        // create targeted offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: true,
            redemptionBasedOn: OfferType.PreLoadedOptInFile
        });

        const optInFileOffer = createOptInFileOffer({
            type: ProductType.CreditCard,
            offers: [rebateCriteria.id],
            tsysCustomerId,
            tsysAccountId
        });

        // create user & assign relevant opt-in data
        const user = await createUser({
            optInFileOffers: [optInFileOffer],
        });

        // create cc transaction for user
        const transaction = await createTransactionForRebateCriteria({
            userId: user.id,
            cardType: CardType.CreditCard,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            tsysCustomerId,
            accountId: tsysAccountId,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for user to be accepted
        await expectToBeProcessed(
            transaction,
            TransactionStatus.RebateCreated
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
