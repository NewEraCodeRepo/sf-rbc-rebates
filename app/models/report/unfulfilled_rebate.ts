export interface IUnfulfilledRebateReport {
    currency: string;
    id: number;
    instructionSentDate: Date | null;
    maskedClientAccount: string;
    merchantId: number;
    offerId: string;
    qualifyingTransactionDate: Date;
    qualifyingTransactionValue: number;
    rebateStatus: string;
    rebateTransactionId: string;
    rebateType: string;
    transactionType: string;
    unfulfilledDays: number;
    rebate: number;
}
