import {requiresDatabase} from "../../support/database";
import {CardType, ITransactionForRebateCriteria, TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import {IRebateCriteria} from "../../../app/models/rebate_criteria";
import { createTransactionForRebateCriteria } from "../../fixtures/transaction_for_rebate_criteria";
import { createRebateCriteria } from "../../fixtures/rebate_criteria";
import {expect} from "chai";
import {RefundReportRepository} from "../../../app/database/repositories/refund_report";
import {RefundReportCreate} from "../../../app/transaction_processing/report/refund_create";
import { IRefundReport } from "app/models/report/refund";

describe("Test RefundReportCreate", () => {
    requiresDatabase();

    let refundReportCreate: RefundReportCreate;
    let transaction: ITransactionForRebateCriteria;
    let rebateCriteria: IRebateCriteria;
    let refundReportCreate2: RefundReportCreate;
    let transaction2: ITransactionForRebateCriteria;
    let userId: string;

    beforeEach(async () => {
        userId = "USER_ID_1";

        rebateCriteria = await createRebateCriteria({
            id: String(Math.floor(Math.random() * 100000) + 1),
        });

        transaction = await createTransactionForRebateCriteria({
            cardType: CardType.CheckingAccount,
            status: TransactionStatus.RefundTrackedForReporting,
            refundReportCreated: false,
            rebateCriteriaId: rebateCriteria.id,
            amount: "1234",
            userId
        });

        transaction2 = await createTransactionForRebateCriteria({
            cardType: CardType.CheckingAccount,
            status: TransactionStatus.RefundTrackedForReporting,
            refundReportCreated: false,
            rebateCriteriaId: rebateCriteria.id,
            amount: "2345",
            userId
        });
    });

    // TODO: Will re-add this once I figure out why it works locally and not in CI
    it.skip("should insert refund report object", async () => {
        refundReportCreate = new RefundReportCreate(
            transaction,
            rebateCriteria,
        );

        refundReportCreate2 = new RefundReportCreate(
            transaction2,
            rebateCriteria,
        );

        await refundReportCreate.perform();
        await refundReportCreate2.perform();

        const records = await RefundReportRepository.findAll({
            where : {
                client_hash_srf__c: userId,
                offerid__c: rebateCriteria.id
            },
            join: {
                alias: 'entity'
            }
        });

        expect(records.length).to.eq(2);

        const firstReport = records.find((report: IRefundReport) => report.transactionAmount === 1234 );
        expect(firstReport).to.not.be.null;

        const secondReport = records.find((report: IRefundReport) => report.transactionAmount === 2345 );
        expect(secondReport).to.not.be.null;

        expect(firstReport!.offerId).to.eq(Number(rebateCriteria.id));
        expect(firstReport!.transactionType).to.eq(transaction.transactionType);
    });
});
