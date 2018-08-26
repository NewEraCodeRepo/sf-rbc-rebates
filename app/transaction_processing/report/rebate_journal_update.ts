import {
    CardType, ITransactionForRebateCriteria, RewardType,
    TransactionStatus
} from "datapipeline-schemas/rebateManagementObject";
import {IRebate} from "../../models/rebate";
import {RebateJournalReportRepository} from "../../database/repositories/rebate_journal_repository";
import {IRebateJournalReport} from "../../models/report/rebate_journal";
import { ILoggable } from "../../interfaces/loggable";

export class RebateJournalReportUpdate {

    constructor(private readonly transaction: ITransactionForRebateCriteria,
                private rebate: IRebate,
                private logger: ILoggable
    ) {}

    public async perform(): Promise<any> {
        const reportUpdate: Partial<IRebateJournalReport> = {
            basePoints: this.transaction.basePoints,
            ccCreditAmount: this.transaction.cardType === CardType.CreditCard ? parseFloat(this.rebate.amount) : 0,
            clientId: this.transaction.userId,
            currency: this.transaction.transactionCurrency,
            fulfilledDate: this.rebate.fulfilledDate,
            maskedClientAccount: this.transaction.card,
            pbaCreditAmount: this.transaction.cardType === CardType.CheckingAccount ? parseFloat(this.rebate.amount) : 0,
            qualifyingTransactionDate: this.rebate.qualifyingTransaction.transactionDate,
            qualifyingTransactionValue: parseFloat(this.rebate.qualifyingTransaction.amount),
            rebateStatus: this.rebate.status,
            rebateTransactionId: this.rebate.id,
            rebateType: this.rebate.rewardType,
            transactionType: this.transaction.cardType,
            rebatePoints: this.rebate.rewardType === RewardType.Points ? parseFloat(this.transaction.amount) : 0,
            rebateDollars: this.rebate.rewardType === RewardType.Dollars ? parseFloat(this.transaction.amount) : 0,
        };

        const existingReport = await this.getExistingReport();

        this.logger.info("Inserting RebateJournal Record...");
        return await RebateJournalReportRepository.update(existingReport.id, reportUpdate);
    }

    protected async getExistingReport(): Promise<IRebateJournalReport> {
        const result = await RebateJournalReportRepository.findAll({
            where : {
                client_id__c: this.rebate.qualifyingTransaction.userId,
                rebate_status_v3__c: TransactionStatus.PendingFulfillment,
                rebate_transaction_id__c: this.rebate.id,
            },
            join: {
                alias: 'entity'
            },
            take: 1,
        });

        if (!result[0]) {
            throw new Error("Could not find existing report!");
        }

        return result[0];
    }

}
