export interface IRebateJournalReport {
    UCINExternalId: string;
    basePoints: number;
    ccCreditAmount: number;
    clientId: string;
    currency: string;
    fulfilledDate: Date | null;
    fulfilledWmResults: number | null;
    id: number;
    instructionSentDate: Date | null;
    maskedClientAccount: string;
    merchantId: string;
    offerId: number;
    pbaCreditAmount: number;
    product: string;
    qualifyingTransactionDate: Date | null;
    qualifyingTransactionValue: number;
    rebateStatus: string;
    rebateTransactionId: string;
    rebateType: string;
    transactionType: string;
    rebateDollars: number;
    rebatePoints: number;
}
