import {UnfulfilledRebateRecord} from "../salesforce_records/unfulfilled_rebate";
import {IUnfulfilledRebateReport} from "../../models/report/unfulfilled_rebate";

export class UnfulfilledRebateSerializer {
    public static serialize(object: IUnfulfilledRebateReport): UnfulfilledRebateRecord {
        return {
            currency__c: object.currency,
            id: object.id,
            instruction_sent_date__c: object.instructionSentDate,
            masked_client_account__c: object.maskedClientAccount,
            merchant_id__c: object.merchantId,
            offer_id__c: parseInt(object.offerId, 10),
            qualifying_transaction_date__c: object.qualifyingTransactionDate,
            qualifying_transaction_value__c: object.qualifyingTransactionValue,
            rebate_status_v3__c: object.rebateStatus,
            rebate_transaction_id__c: object.rebateTransactionId,
            rebate_type__c: object.rebateType,
            transaction_type__c: object.transactionType,
            unfulfilled_days__c: object.unfulfilledDays,
            rebate__c: object.rebate
        };
    }

    public static deserialize(record: UnfulfilledRebateRecord): IUnfulfilledRebateReport {
        return {
            currency: record.currency__c,
            id: record.id,
            instructionSentDate: record.instruction_sent_date__c,
            maskedClientAccount: record.masked_client_account__c,
            merchantId: record.merchant_id__c,
            offerId: String(record.offer_id__c),
            qualifyingTransactionDate: record.qualifying_transaction_date__c,
            qualifyingTransactionValue: record.qualifying_transaction_value__c,
            rebateStatus: record.rebate_status_v3__c,
            rebateTransactionId: record.rebate_transaction_id__c,
            rebateType: record.rebate_type__c,
            transactionType: record.transaction_type__c,
            unfulfilledDays: record.unfulfilled_days__c,
            rebate: record.rebate__c
        };
    }
}
