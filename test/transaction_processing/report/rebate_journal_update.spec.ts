import { requiresDatabase } from "../../support/database";
import {
    CardType, ITransactionForRebateCriteria, RewardType,
    TransactionStatus
} from "datapipeline-schemas/rebateManagementObject";
import { IRebate } from "../../../app/models/rebate";
import { createTransactionForRebateCriteria } from "../../fixtures/transaction_for_rebate_criteria";
import { createRebate } from "../../fixtures/rebate";
import { RebateJournalReportRepository } from "../../../app/database/repositories/rebate_journal_repository";
import { TestLogger } from "../../support/test_logger";
import { RebateJournalReportUpdate } from "../../../app/transaction_processing/report/rebate_journal_update";
import { createRebateJournalReport } from "../../fixtures/rebate_journal_report";
import { IRebateJournalReport} from "../../../app/models/report/rebate_journal";
import { expect } from "chai";
import moment = require("moment");
import { IRebateCriteria } from "app/models/rebate_criteria";
import { createRebateCriteria } from "../../fixtures/rebate_criteria";

describe("Test RebateJournalReportUpdate", () => {
    requiresDatabase();

    let rebateJournalReportUpdate: RebateJournalReportUpdate;

    let transaction: ITransactionForRebateCriteria;
    let rebateCriteria: IRebateCriteria;
    let rebate: IRebate;
    let existingReport: IRebateJournalReport;

    beforeEach(async () => {
        rebateCriteria = await createRebateCriteria({
            id: String(Math.floor(Math.random() * 100000) + 1),
        });
        transaction = await createTransactionForRebateCriteria({
            cardType: CardType.CheckingAccount,
            rebateCriteriaId: rebateCriteria.id
        });
        rebate = await createRebate({
            qualifyingTransaction: transaction,
            status: TransactionStatus.FulfilledTransSuccessful,
            rewardType: RewardType.Dollars,
            rebateCriteriaId: rebateCriteria.id
        });

        existingReport = await createRebateJournalReport({
            clientId: rebate.qualifyingTransaction.userId,
            rebateStatus: TransactionStatus.PendingFulfillment,
            rebateTransactionId: rebate.id,
        });

        rebateJournalReportUpdate = new RebateJournalReportUpdate(
            transaction,
            rebate,
            new TestLogger()
        );
    });

    it("should update IRebateJournalReport", async () => {
        existingReport = await RebateJournalReportRepository.insert(existingReport);

        await rebateJournalReportUpdate.perform();

        const record = await RebateJournalReportRepository.last();

        expect(record.basePoints).to.eq(transaction.basePoints);
        expect(record.ccCreditAmount).to.eq(0);
        expect(record.clientId).to.eq(transaction.userId);
        expect(record.currency).to.eq(transaction.transactionCurrency);
        expect(record.maskedClientAccount).to.eq(transaction.card);
        expect(record.pbaCreditAmount).to.eq(parseFloat(rebate.amount));
        expect(moment(record.qualifyingTransactionDate as Date).format("YMD"))
            .to.eq(moment(rebate.qualifyingTransaction.transactionDate as Date).format("YMD"));
        expect(record.qualifyingTransactionValue).to.eq(parseFloat(rebate.qualifyingTransaction.amount));
        expect(record.rebateTransactionId).to.eq(rebate.id);
        expect(record.transactionType).to.eq(transaction.cardType);
        expect(record.rebatePoints).to.eq(0);
        expect(record.rebateDollars).to.eq(parseFloat(transaction.amount));
    });
});
