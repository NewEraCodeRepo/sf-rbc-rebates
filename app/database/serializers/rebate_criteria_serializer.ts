import { IRebateCriteria } from '../../models/rebate_criteria';
import { RebateCriteriaRecord } from '../records/rebate_criteria_record';

export class RebateCriteriaSerializer {
  public static serialize(object: IRebateCriteria): RebateCriteriaRecord {
    return {
      id: object.id,
      description_for_testing: object.descriptionForTesting,
      redemption_limit: object.redemptionLimit,
      redemption_limit_type: object.redemptionLimitType,
      eligible_products: object.eligibleProducts,
      data: {
        isRedeemable: object.isRedeemable,
        refundPeriodInDays: object.refundPeriodInDays,
        rewardCalculation: object.rewardCalculation,
        validFromDate: object.validFromDate,
        validToDate: object.validToDate,
        merchantId: object.merchantId,
        hasBeenActivated: object.hasBeenActivated,
        requiresCustomerToBeLinked: object.requiresCustomerToBeLinked,
        requiresCustomerToBeTargeted: object.requiresCustomerToBeTargeted,
        redemptionPeriodInDays: object.redemptionPeriodInDays,
        redemptionBasedOn: object.redemptionBasedOn
      }
    };
  }

  public static deserialize(record: RebateCriteriaRecord): IRebateCriteria {
    return {
      ...record.data,
      id: record.id,
      descriptionForTesting: record.description_for_testing,
      validFromDate: new Date(record.data.validFromDate),
      validToDate: new Date(record.data.validToDate),
      redemptionLimit: record.redemption_limit,
      redemptionLimitType: record.redemption_limit_type,
      eligibleProducts: record.eligible_products
    };
  }
}
