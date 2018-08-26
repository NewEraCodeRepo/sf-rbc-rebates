import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import * as Moment from "moment-timezone";
import { extendMoment } from 'moment-range';
import { IRebateCriteria } from "../../../app/models/rebate_criteria";
const moment = extendMoment(Moment);

export class RefundContext {
    constructor(
        public readonly transaction: ITransactionForRebateCriteria,
        public readonly optionalRebateCriteria?: IRebateCriteria,
    ) {}

    get rebateCriteriaIsMissing() {
        return !this.optionalRebateCriteria;
    }

    get rebateCriteria() {
        return this.optionalRebateCriteria as IRebateCriteria;
    }

    get isTrackingRefunds(): boolean {
        const hasBeenActivated = this.rebateCriteria.hasBeenActivated;
        const isRedeemable = this.rebateCriteria.isRedeemable;

        return this.isCurrentlyValid && hasBeenActivated && isRedeemable;
    }

    private get isCurrentlyValid(): boolean {
        const transactionDate = moment(this.transaction.transactionDate).tz("UTC");
        const validFrom = moment(this.rebateCriteria.validFromDate).tz("UTC");
        const validTo = moment(this.rebateCriteria.validToDate).tz("UTC");
        const refundTo = moment(validTo).add(this.rebateCriteria.refundPeriodInDays, "days");

        return moment.range(validFrom, refundTo).contains(transactionDate);
    }
}
