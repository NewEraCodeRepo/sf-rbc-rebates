import { IUser } from '../../models/user';
import { UserRecord } from '../records/user_record';

export class UserSerializer {
  public static serialize(object: IUser): UserRecord {
    return {
      id: object.id,
      linked_offer_ids: object.linkedOfferIds,
      targeted_offer_ids: object.targetedOfferIds,
      opt_in_file_offers: object.optInFileOffers,
      is_enrolled: object.isEnrolled,
      is_blacklisted: object.isBlacklisted,
      credit_card_products: object.creditCardProducts,
      debit_card_products: object.debitCardProducts
    };
  }

  public static deserialize(record: UserRecord): IUser {
    return {
      id: record.id,
      linkedOfferIds: record.linked_offer_ids,
      targetedOfferIds: record.targeted_offer_ids,
      optInFileOffers: record.opt_in_file_offers,
      isEnrolled: record.is_enrolled,
      isBlacklisted: record.is_blacklisted,
      creditCardProducts: record.credit_card_products,
      debitCardProducts: record.debit_card_products
    };
  }
}
