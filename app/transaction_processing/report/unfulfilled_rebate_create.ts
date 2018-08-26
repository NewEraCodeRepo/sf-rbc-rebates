import {UnfilfilledRebateReportRepository} from "../../database/repositories/unfulfilled_rebate_repository";
import {IUnfulfilledRebateReport} from "../../models/report/unfulfilled_rebate";
import {IRebate} from "../../models/rebate";
import {IRebateCriteria} from "../../models/rebate_criteria";
import {RebateCriteriaRepository} from "../../database/repositories/rebate_criteria_repository";
import {ILoggable} from "../../interfaces/loggable";

export class UnfulfilledRebateReportCreate {

    private rebateCriteria: IRebateCriteria;

    constructor(private rebate: IRebate,
                private logger: ILoggable,
            ) {}

    public async perform() {
        const rebateCriteria = await this.getRebateCriteria();

        const unfulfilledRebate: Partial<IUnfulfilledRebateReport> = {
            currency: this.rebate.qualifyingTransaction.transactionCurrency,
            instructionSentDate: this.rebate.qualifyingTransaction.processedAt,
            maskedClientAccount: this.rebate.qualifyingTransaction.card,
            merchantId: Number(rebateCriteria.merchantId),
            offerId: rebateCriteria.id,
            qualifyingTransactionDate: this.rebate.qualifyingTransaction.transactionDate,
            qualifyingTransactionValue: Number(this.rebate.qualifyingTransaction.amount),
            rebateStatus: this.rebate.status,
            rebateTransactionId: this.rebate.id,
            rebateType: this.rebate.rewardType,
            transactionType: this.rebate.qualifyingTransaction.cardType,
            rebate: parseFloat(this.rebate!.amount)
        };
        this.logger.info("Inserting UnfulfilledRebate Record...");
        await UnfilfilledRebateReportRepository.insert(unfulfilledRebate);
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
