import {RebateJournalRecord} from "../salesforce_records/rebate_journal_record";
import {IRebateJournalReport} from "../../models/report/rebate_journal";

export class RebateJournalSerializer {
    public static serialize(object: IRebateJournalReport): RebateJournalRecord {
        return {
            ucin_external_id__c: object.UCINExternalId,
            base_points__c: object.basePoints,
            cc_credit_amount__c: object.ccCreditAmount,
            client_id__c: object.clientId,
            currency__c: object.currency,
            fulfilled_date__c: object.fulfilledDate,
            fullfilled_wmresults__c: object.fulfilledWmResults,
            id: object.id,
            instruction_sent_date__c: object.instructionSentDate,
            masked_client_account__c: object.maskedClientAccount,
            merchant_id__c: object.merchantId,
            offer_id__c: object.offerId,
            pba_credit_amount__c: object.pbaCreditAmount,
            product__c: object.product,
            qualifying_transaction_date__c: object.qualifyingTransactionDate,
            qualifying_transaction_value__c: object.qualifyingTransactionValue,
            rebate_status_v3__c: object.rebateStatus,
            rebate_transaction_id__c: object.rebateTransactionId,
            rebate_type__c: object.rebateType,
            transaction_type__c: object.transactionType,
            rebate_dollars__c: object.rebateDollars,
            rebate_points__c: object.rebatePoints
        };
    }

    public static deserialize(record: RebateJournalRecord): IRebateJournalReport {
        return {
            UCINExternalId: record.ucin_external_id__c,
            basePoints: record.base_points__c,
            ccCreditAmount: record.cc_credit_amount__c,
            clientId: record.client_id__c,
            currency: record.currency__c,
            fulfilledDate: record.fulfilled_date__c,
            fulfilledWmResults: record.fullfilled_wmresults__c,
            id: record.id,
            instructionSentDate: record.instruction_sent_date__c,
            maskedClientAccount: record.masked_client_account__c,
            merchantId: record.merchant_id__c,
            offerId: record.offer_id__c,
            pbaCreditAmount: record.pba_credit_amount__c,
            product: record.product__c,
            qualifyingTransactionDate: record.qualifying_transaction_date__c,
            qualifyingTransactionValue: record.qualifying_transaction_value__c,
            rebateStatus: record.rebate_status_v3__c,
            rebateTransactionId: record.rebate_transaction_id__c,
            rebateType: record.rebate_type__c,
            transactionType: record.transaction_type__c,
            rebateDollars: record.rebate_dollars__c,
            rebatePoints: record.rebate_points__c
        };
    }
}
