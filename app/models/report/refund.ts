export interface IRefundReport {
    clientAccountNumber: string;
    clientHashSRF: string;
    id: number;
    merchantId: string;
    offerId: number;
    transactionAmount: number;
    transactionDate: Date;
    transactionType: string;
}
