import {Repository} from "./repository";
import {RebateJournalSerializer} from "../serializers/rebate_journal_serializer";
import {RebateJournalRecord} from "../salesforce_records/rebate_journal_record";
import {IRebateJournalReport} from "../../models/report/rebate_journal";

class RepositoryForRebateJournalReport extends Repository<IRebateJournalReport> {
    constructor(record = RebateJournalRecord, serializer = RebateJournalSerializer) {
        super(record, serializer, 'heroku_connect');
    }
}

export const RebateJournalReportRepository = new RepositoryForRebateJournalReport();
