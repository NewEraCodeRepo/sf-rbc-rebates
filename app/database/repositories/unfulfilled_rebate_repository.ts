import {Repository} from "./repository";
import {IUnfulfilledRebateReport} from "../../models/report/unfulfilled_rebate";
import {UnfulfilledRebateSerializer} from "../serializers/unfulfilled_rebate_serializer";
import {UnfulfilledRebateRecord} from "../salesforce_records/unfulfilled_rebate";

class RepositoryForUnfulfulledRebateReport extends Repository<IUnfulfilledRebateReport> {
    constructor(record = UnfulfilledRebateRecord, serializer = UnfulfilledRebateSerializer) {
        super(record, serializer, 'heroku_connect');
    }
}

export const UnfilfilledRebateReportRepository = new RepositoryForUnfulfulledRebateReport();
