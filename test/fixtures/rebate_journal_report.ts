import {IRebateJournalReport} from "../../app/models/report/rebate_journal";
import {RebateJournalReportRepository} from "../../app/database/repositories/rebate_journal_repository";
import * as faker from "faker";
import {randomEnumValue} from "../support/random_enum_value";
import {TransactionStatus, TransactionType} from "datapipeline-schemas/rebateManagementObject";
import { CardType } from "datapipeline-schemas/sharedData";

export default function buildRebateJournalReport(attrs: Partial<IRebateJournalReport> = {}): IRebateJournalReport {
    return {
        UCINExternalId: '',
        basePoints: 0,
        ccCreditAmount: faker.random.number(2000),
        clientId: `CL${faker.random.alphaNumeric(16)}`,
        currency: 'CAD',
        fulfilledDate: new Date(),
        fulfilledWmResults: 0,
        id: faker.random.number(2000),
        instructionSentDate: new Date(),
        maskedClientAccount: '',
        merchantId: `ME${faker.random.alphaNumeric(16)}`,
        offerId: faker.random.number(20000),
        pbaCreditAmount: faker.random.number(2000),
        product: `PR${faker.random.alphaNumeric(16)}`,
        qualifyingTransactionDate: new Date(),
        qualifyingTransactionValue: faker.random.number(2000),
        rebateStatus: randomEnumValue(TransactionStatus),
        rebateTransactionId: faker.random.number(2000).toString(),
        rebateType: randomEnumValue(CardType),
        transactionType: randomEnumValue(TransactionType),
        rebateDollars: faker.random.number(2000),
        rebatePoints: faker.random.number(2000),
        ...attrs,
    };
}

export async function createRebateJournalReport(attrs: Partial<IRebateJournalReport> = {}): Promise<IRebateJournalReport> {
    return await RebateJournalReportRepository.insert(buildRebateJournalReport(attrs));
}
