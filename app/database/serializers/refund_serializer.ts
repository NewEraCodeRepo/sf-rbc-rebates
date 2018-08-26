import {IRefundReport} from "../../models/report/refund";
import {RefundRecord} from "../salesforce_records/refund_record";

export class RefundSerializer {
    public static serialize(object: IRefundReport): RefundRecord {
        return {
            client_account_number__c: object.clientAccountNumber,
            client_hash_srf__c: object.clientHashSRF,
            id: object.id,
            merchant_id__c: object.merchantId,
            offerid__c: object.offerId,
            transactionamount__c: object.transactionAmount,
            transaction_date__c: object.transactionDate,
            transaction_type__c: object.transactionType,
        };
    }

    public static deserialize(record: RefundRecord): IRefundReport {
        return {
            clientAccountNumber: record.client_account_number__c,
            clientHashSRF: record.client_hash_srf__c,
            id: record.id,
            merchantId: record.merchant_id__c,
            offerId: record.offerid__c,
            transactionAmount: record.transactionamount__c,
            transactionDate: record.transaction_date__c,
            transactionType: record.transaction_type__c,
        };
    }
}
