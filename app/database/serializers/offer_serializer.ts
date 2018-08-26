import { IOffer } from '../../models/offer';
import { OfferRecord } from '../salesforce_records/offer_record';

export class OfferSerializer {
  public static serialize(object: IOffer): OfferRecord {
      return {
        id: parseInt(object.id, 10),
        isdeleted: object.isDeleted,
        name: object.name,
        offer_id__c: object.offerId,
        running_redemption_amount_v3__c: object.runningRedemptionAmount,
        running_redemption_count__c: object.runningRedemptionCount,
        sfid: object.sfId,
    };
  }

  public static deserialize(record: OfferRecord): IOffer {
    return {
      id: record.id.toString(),
      isDeleted: record.isdeleted,
      name: record.name,
      offerId: record.offer_id__c,
      runningRedemptionAmount: record.running_redemption_amount_v3__c,
      runningRedemptionCount: record.running_redemption_count__c,
      sfId: record.sfid
    };
  }
}
