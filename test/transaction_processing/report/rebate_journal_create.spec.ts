import { requiresDatabase } from "../../support/database";
import { RebateJournalReportCreate } from "../../../app/transaction_processing/report/rebate_journal_create";
import { CardType, ITransactionForRebateCriteria, TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { IRebate } from "../../../app/models/rebate";
import { IRebateCriteria } from "../../../app/models/rebate_criteria";
import { createTransactionForRebateCriteria } from "../../fixtures/transaction_for_rebate_criteria";
import { createRebate } from "../../fixtures/rebate";
import { createRebateCriteria } from "../../fixtures/rebate_criteria";
import { RebateJournalReportRepository } from "../../../app/database/repositories/rebate_journal_repository";
import { expect } from "chai";
import * as moment from "moment";
import { IProduct } from "../../../app/models/product";
import { createProduct } from "../../fixtures/product";
import { TestLogger } from "../../support/test_logger";

describe("Test RebateJournalReportCreate", () => {
    requiresDatabase();

    let rebateJournalReportCreate: RebateJournalReportCreate;

    let transaction: ITransactionForRebateCriteria;
    let rebate: IRebate;
    let rebateCriteria: IRebateCriteria;
    let product: IProduct;

    beforeEach(async () => {
        rebateCriteria = await createRebateCriteria({
            id: '200002',
        });

        transaction = await createTransactionForRebateCriteria({
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id,
        });
        rebate = await createRebate({
            qualifyingTransaction: transaction,
            status: TransactionStatus.PendingFulfillment,
            rebateCriteriaId: rebateCriteria.id,
        });
    });

    it("should insert IRebateJournalReport", async () => {
        product = await createProduct({
            productCodeExternal: transaction.productCodeExternal,
        });

        rebateJournalReportCreate = new RebateJournalReportCreate(
            rebate,
            new TestLogger()
        );

        await rebateJournalReportCreate.perform();

        const record = await RebateJournalReportRepository.last();

        expect(record.basePoints).to.eq(transaction.basePoints);
        expect(record.ccCreditAmount).to.eq(0);
        expect(record.clientId).to.eq(transaction.userId);
        expect(record.currency).to.eq(transaction.transactionCurrency);
        expect(record.maskedClientAccount).to.eq(transaction.card);
        expect(record.merchantId).to.eq(rebateCriteria.merchantId);
        expect(record.offerId).to.eq(Number(rebateCriteria.id));
        expect(record.pbaCreditAmount).to.eq(Number(rebate.amount));
        expect(record.product).to.eq(product.sfId);
        expect(record.qualifyingTransactionValue).to.eq(Number(rebate.qualifyingTransaction.amount));
        expect(record.rebateStatus).to.eq(rebate.status);
        expect(record.rebateTransactionId).to.eq(rebate.id);
        expect(record.rebateType).to.eq(rebate.rewardType);
        expect(record.transactionType).to.eq(transaction.cardType);
        expect(moment(record.instructionSentDate as Date).format("YMD"))
            .to.eq(moment(new Date()).format("YMD"));
        expect(moment(record.qualifyingTransactionDate as Date).format("YMD"))
            .to.eq(moment(rebate.qualifyingTransaction.transactionDate as Date).format("YMD"));
    });
});
