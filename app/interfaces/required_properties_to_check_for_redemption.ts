import { RedemptionLimitType } from "./redemption_limit_type";

export interface IRequiredPropertiesToCheckForRedemption {
  userId: string;
  rebateCriteriaId: string;
  card?: string;
  redemptionLimit: number;
  redemptionType: RedemptionLimitType;
}
