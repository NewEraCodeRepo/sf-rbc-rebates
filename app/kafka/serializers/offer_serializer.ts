import { IOfferDocument } from "datapipeline-schemas/sharedData";
import { IRebateCriteria } from "../../../app/models/rebate_criteria";
import { OfferBenefitToCustomer } from "../../../app/interfaces/offer_benefit_to_customer";
import { RedemptionLimitType } from "../../../app/interfaces/redemption_limit_type";
import { RewardCalculationInterpretation } from "../../../app/offer_import/reward_calculation_interpretation";

const REDEMPTION_LIMIT_TYPE = {
    "Overall": RedemptionLimitType.Overall,
    "Per RBC Card": RedemptionLimitType.PerCard,
};

export class KafkaOfferSerializer {
    public static serialize(object: IOfferDocument): IRebateCriteria {

        const rewardCalculation = RewardCalculationInterpretation.from({
            benefitToCustomer: object.benefitToCustomer as OfferBenefitToCustomer,
            rebateAmount: object.rebateAmount > 0 ? object.rebateAmount.toString() : "0.00"
        });

        return {
            id: object.id,
            isRedeemable: object.isRedeemable,
            descriptionForTesting: null,
            rewardCalculation,
            refundPeriodInDays: object.refundPeriod,
            validFromDate: object.validFromDate,
            validToDate: object.validToDate,
            merchantId: object.merchantId,
            hasBeenActivated: object.wasActive,
            requiresCustomerToBeLinked: object.requiresLinkToProfile,
            requiresCustomerToBeTargeted: object.isTargeted,
            redemptionLimit: object.redemptionLimit,
            redemptionLimitType: REDEMPTION_LIMIT_TYPE[object.redemptionLimitType],
            redemptionPeriodInDays: object.numOfDaysToWatchAndMatch,
            eligibleProducts: object.products,
            redemptionBasedOn: object.redemptionBasedOn
        };
    }
}
