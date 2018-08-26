import { expect } from "chai";
import { requiresDatabase } from '../support/database';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { createTransactionForRebateCriteria } from '../fixtures/transaction_for_rebate_criteria';
import { createUser } from '../fixtures/user';
import {
    createOptInFileOffer,
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
import {ProductType} from "datapipeline-schemas/userObject";
import {OfferType} from "datapipeline-schemas/salesforceObject";

describe("Debit card pre-loaded opt-in file verification", () => {
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

    it('accepts debit card transaction if account_id in opt-in file', async () => {
        const ddaAccountNumberHashed = "A_TEST_ACCOUNT";

        // create offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            redemptionBasedOn: OfferType.PreLoadedOptInFile
        });

        const optInFileOffer = createOptInFileOffer({
            type: ProductType.DDA,
            offers: [rebateCriteria.id],
            tsysAccountId: ddaAccountNumberHashed
        });

        // create user & assign relevant opt-in data
        const user = await createUser({
            optInFileOffers: [optInFileOffer],
        });

        // create dda transaction for user
        const transaction = await createTransactionForRebateCriteria({
            userId: user.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            accountId: ddaAccountNumberHashed,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for user to be accepted
        await expectToBeProcessed(
          transaction,
          TransactionStatus.RebateCreated
        );
    });

    it('rejects debit card transaction if account_id not in opt-in file', async () => {
        const ddaAccountNumberHashed = "A_TEST_ACCOUNT";
        const ddaAccountNumberHashedFail = "TEST_DDA_ACCT_ID_FAIL";

        // create offer & assign eligible product list
        const rebateCriteria = await createRebateCriteria({
            isRedeemable: true,
            hasBeenActivated: true,
            requiresCustomerToBeLinked: false,
            requiresCustomerToBeTargeted: false,
            redemptionBasedOn: OfferType.PreLoadedOptInFile
        });

        const optInFileOffer = createOptInFileOffer({
            type: ProductType.DDA,
            offers: [rebateCriteria.id],
            tsysAccountId: ddaAccountNumberHashedFail
        });

        // create user & assign relevant opt-in data
        const user = await createUser({
            optInFileOffers: [optInFileOffer],
        });

        // create dda transaction for user
        const transaction = await createTransactionForRebateCriteria({
            userId: user.id,
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
            transactionType: TransactionType.Qualifying,
            accountId: ddaAccountNumberHashed,
            processedAt: null
        });

        await TransactionProcessing.perform({ logger });

        // expect transaction for user to be rejected
        await expectToBeProcessed(
          transaction,
          TransactionStatus.ClientNotInOptInFile
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
