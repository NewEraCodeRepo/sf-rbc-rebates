import {ITransactionForRebateCriteria, TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import {IRefundReport} from "../../models/report/refund";
import {RefundReportRepository} from "../../database/repositories/refund_report";
import {IRebateCriteria} from "../../models/rebate_criteria";
import {TransactionForRebateCriteriaRepository} from "../../database/repositories/transaction_for_rebate_criteria_repository";
import {TransactionType} from "datapipeline-schemas/sharedData";
import {In} from "typeorm";

export class RefundReportCreate {

    constructor(private readonly transaction: ITransactionForRebateCriteria,
                private rebateCriteria: IRebateCriteria) {}

    public async perform(): Promise<IRefundReport | boolean> {

        // get the transactions of status "refund_tracked_for_reporting"
        const refundsAlreadyCreated = await this.getRefundTransactionsForClientOffer();

        if (refundsAlreadyCreated.length >= 2 ) {
            // look up the refunds for this user for this offer
            const associatedQualifyingTransactions = await this.getAssociatedQualifyingTransactions();

            // insert refunds that need to be
            for (const refund of refundsAlreadyCreated) {
                await this.insertRefundReportFromTransaction(refund);
            }
            // insert qualifying transactions for those refunds
            for (const trans of associatedQualifyingTransactions ) {
                await this.insertRefundReportFromTransaction(trans);
            }
        }

        return true;
    }

    protected async insertRefundReportFromTransaction(transaction: ITransactionForRebateCriteria): Promise<IRefundReport | boolean > {

        if ( !transaction.refundReportCreated ) {
            const report: Partial<IRefundReport> = {
                clientAccountNumber: transaction.accountId,
                clientHashSRF: transaction.userId,
                merchantId: this.rebateCriteria.merchantId,
                offerId: parseInt(transaction.rebateCriteriaId, 10),
                transactionAmount: Number(transaction.amount),
                transactionDate: transaction.transactionDate,
                transactionType: transaction.transactionType,
            };

            const reportCreated = await RefundReportRepository.insert(report);
            await TransactionForRebateCriteriaRepository.update(transaction.id, { refundReportCreated : true });
            return reportCreated;
        }
        return true;
    }

    protected async getAssociatedQualifyingTransactions(): Promise<ITransactionForRebateCriteria[]> {
        return await TransactionForRebateCriteriaRepository.findAll({
            where : {
                user_id: this.transaction.userId,
                rebate_criteria_id: this.transaction.rebateCriteriaId,
                transaction_type: TransactionType.Qualifying,
                status: In([
                    TransactionStatus.PendingExtraction,
                    TransactionStatus.PendingFulfillment,
                    TransactionStatus.FulfilledTransSuccessful,
                    TransactionStatus.RebateCreated
                ]),
                refund_report_created: false
            },
            join: {
                alias: 'entity'
            }
        });
    }

    protected async getRefundTransactionsForClientOffer(): Promise<ITransactionForRebateCriteria[]> {
        return await TransactionForRebateCriteriaRepository.findAll({
            where : {
                user_id: this.transaction.userId,
                rebate_criteria_id: this.transaction.rebateCriteriaId,
                status: TransactionStatus.RefundTrackedForReporting
            },
            join: {
                alias: 'entity'
            }
        });
    }
}
