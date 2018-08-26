import {Repository} from "./repository";
import {IRefundReport} from "../../models/report/refund";
import {RefundSerializer} from "../serializers/refund_serializer";
import {RefundRecord} from "../salesforce_records/refund_record";

class RepositoryForRefundReport extends Repository<IRefundReport> {
    constructor(record = RefundRecord, serializer = RefundSerializer) {
        super(record, serializer, 'heroku_connect');
    }
}

export const RefundReportRepository = new RepositoryForRefundReport();
