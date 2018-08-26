import {requiresDatabase} from "../../support/database";
import {CardType, ITransactionForRebateCriteria, TransactionStatus, TransactionType} from "datapipeline-schemas/rebateManagementObject";
import {IRebate} from "../../../app/models/rebate";
import {IRebateCriteria} from "../../../app/models/rebate_criteria";
import { createTransactionForRebateCriteria } from "../../fixtures/transaction_for_rebate_criteria";
import { createRebate } from "../../fixtures/rebate";
import { createRebateCriteria } from "../../fixtures/rebate_criteria";
import { expect } from "chai";
import * as moment from "moment";
import {UnfulfilledRebateReportCreate} from "../../../app/transaction_processing/report/unfulfilled_rebate_create";
import {UnfilfilledRebateReportRepository} from "../../../app/database/repositories/unfulfilled_rebate_repository";
import {TestLogger} from "../../support/test_logger";

describe("Test UnfulfilledRebateReportCreate", () => {
    requiresDatabase();

    let unfulfilledRebateReportCreate: UnfulfilledRebateReportCreate;

    let transaction: ITransactionForRebateCriteria;
    let rebate: IRebate;
    let rebateCriteria: IRebateCriteria;

    beforeEach( async () => {
        rebateCriteria = await createRebateCriteria({
            id: '200002',
        });
        transaction = await createTransactionForRebateCriteria({
            id: (Math.floor(Math.random() * 100000) + 1),
            cardType: CardType.CheckingAccount,
            rebateId: '100001',
            rebateCriteriaId: '200002',
            transactionType: TransactionType.Qualifying
        });
        rebate = await createRebate({
            qualifyingTransaction: transaction,
            status: TransactionStatus.PendingFulfillment,
            rebateCriteriaId: '200002'
        });
    });

    it("should insert IRebateJournalReport", async () => {
        unfulfilledRebateReportCreate = new UnfulfilledRebateReportCreate(rebate, new TestLogger());

        await unfulfilledRebateReportCreate.perform();

        const record = await UnfilfilledRebateReportRepository.last();

        expect(record.currency).to.eq(transaction.transactionCurrency);
        expect(record.maskedClientAccount).to.eq(transaction.card);
        expect(record.merchantId).to.eq(rebateCriteria.merchantId);
        expect(record.offerId).to.eq(rebateCriteria.id);
        expect(record.qualifyingTransactionValue).to.eq(Number(transaction.amount));
        expect(record.rebateStatus).to.eq(rebate.status);
        expect(record.rebateTransactionId).to.eq(rebate.id);
        expect(record.rebateType).to.eq(rebate.rewardType);
        expect(record.transactionType).to.eq(rebate.qualifyingTransaction.cardType);
        expect(moment(record.qualifyingTransactionDate as Date).format("YMD"))
            .to.eq(moment(transaction.transactionDate as Date).format("YMD"));
        expect(moment(record.instructionSentDate as Date).format("YMD"))
            .to.eq(moment(transaction.processedAt as Date).format("YMD"));
    });
});
