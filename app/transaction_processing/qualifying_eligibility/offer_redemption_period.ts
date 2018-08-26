import { IRebateCriteria } from "../../models/rebate_criteria";
import { QualifyingStrategy } from "../qualifying_strategy";
import * as Moment from "moment-timezone";
import { extendMoment } from 'moment-range';
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
const moment = extendMoment(Moment);

export class OfferRedemptionPeriod {
    public static async doesAccept(
        context: QualifyingStrategy
    ) {

        const { criteria, transaction, logger } = context;

        logger.info('Criteria requires offer to be within redemption period');

        if (this.isWithinRedemptionPeriod(criteria, transaction)) {
            logger.info('Offer', criteria.id, 'is within redemption period');
            return true;
        } else {
            logger.info('Offer', criteria.id, 'is not within redemption period');
            return false;
        }
    }

    private static isWithinRedemptionPeriod(criteria: IRebateCriteria, transaction: ITransactionForRebateCriteria): boolean {
        const transactionDate = moment(transaction.transactionDate).tz("UTC");
        const validFrom = moment(criteria.validFromDate).tz("UTC");
        const validTo = moment(criteria.validToDate).tz("UTC");

        return criteria.hasBeenActivated && criteria.isRedeemable && moment.range(validFrom, validTo).contains(transactionDate);
    }
}
