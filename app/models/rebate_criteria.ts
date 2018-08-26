import { IRewardCalculation } from "../interfaces/reward_calculation";
import { RedemptionLimitType } from "../interfaces/redemption_limit_type";
import { IObjectMap, IProductDocument } from "datapipeline-schemas/sharedData";
import { OfferType } from "datapipeline-schemas/salesforceObject";

// Represents an offer's rebate criteria.
export interface IRebateCriteria {
    id: string;
    isRedeemable: boolean;
    descriptionForTesting: string | null;
    rewardCalculation: IRewardCalculation;
    refundPeriodInDays: number;
    validFromDate: Date;
    validToDate: Date;
    merchantId: string;
    hasBeenActivated: boolean;
    requiresCustomerToBeLinked: boolean;
    requiresCustomerToBeTargeted: boolean;
    redemptionLimit: number;
    redemptionLimitType: RedemptionLimitType;
    redemptionPeriodInDays: number;
    eligibleProducts: IObjectMap<IProductDocument>;
    redemptionBasedOn: OfferType;
}
