import {CardType, RewardType} from "datapipeline-schemas/rebateManagementObject";
import {IRebate} from "../../models/rebate";
import {RebateJournalReportRepository} from "../../database/repositories/rebate_journal_repository";
import {IRebateJournalReport} from "../../models/report/rebate_journal";
import {IRebateCriteria} from "../../models/rebate_criteria";
import {ProductRepository} from "../../database/repositories/product_repository";
import { ILoggable } from "../../interfaces/loggable";
import {RebateCriteriaRepository} from "../../database/repositories/rebate_criteria_repository";

export class RebateJournalReportCreate {

    private rebateCriteria: IRebateCriteria;

    constructor(private rebate: IRebate,
                private logger: ILoggable
            ) {}

    public async perform(): Promise<IRebateJournalReport | void> {
        const rebateCriteria = await this.getRebateCriteria();

        const report: Partial<IRebateJournalReport> = {
            basePoints: this.rebate.qualifyingTransaction.basePoints,
            ccCreditAmount: this.rebate.qualifyingTransaction.cardType === CardType.CreditCard ? parseFloat(this.rebate.amount) : 0,
            clientId: this.rebate.qualifyingTransaction.userId,
            currency: this.rebate.qualifyingTransaction.transactionCurrency,
            fulfilledDate: this.rebate.fulfilledDate,
            instructionSentDate: new Date(),
            maskedClientAccount: this.rebate.qualifyingTransaction.card,
            merchantId: rebateCriteria.merchantId,
            offerId: parseInt(rebateCriteria.id, 10),
            pbaCreditAmount: this.rebate.qualifyingTransaction.cardType === CardType.CheckingAccount ? parseFloat(this.rebate.amount) : 0,
            product: await this.getProductSfIdFromProductCode(this.rebate.qualifyingTransaction.productCodeExternal),
            qualifyingTransactionDate: this.rebate.qualifyingTransaction.transactionDate,
            qualifyingTransactionValue: parseFloat(this.rebate.qualifyingTransaction.amount),
            rebateStatus: this.rebate.status,
            rebateTransactionId: this.rebate.id,
            rebateType: this.rebate.rewardType,
            transactionType: this.rebate.qualifyingTransaction.cardType,
            rebatePoints: this.rebate.rewardType === RewardType.Points ? parseFloat(this.rebate.amount) : 0,
            rebateDollars: this.rebate.rewardType === RewardType.Dollars ? parseFloat(this.rebate.amount) : 0,
        };

        this.logger.info("Inserting RebateJournal Record...");
        return await RebateJournalReportRepository.insert(report);
    }

    protected async getProductSfIdFromProductCode(code: string): Promise<string> {
        const product = await ProductRepository.getProductFromProductCodeExternal(code);

        return product === null ? "" : product.sfId;
    }

    private async getRebateCriteria(): Promise<IRebateCriteria> {
        if (!this.rebateCriteria) {
            const rebateCriteria = await RebateCriteriaRepository.find(this.rebate.qualifyingTransaction.rebateCriteriaId);

            if (!rebateCriteria) {
                throw new Error(`Couln not find rebate criteria: ${this.rebate.qualifyingTransaction.rebateCriteriaId}`);
            }

            this.rebateCriteria = rebateCriteria;
        }

        return this.rebateCriteria;
    }
}
