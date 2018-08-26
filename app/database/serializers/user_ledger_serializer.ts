import { IUserLedger } from '../../models/user_ledger';
import { UserLedgerRecord } from '../history_records/user_ledger_record';

export class UserLedgerSerializer {
  public static serialize(object: IUserLedger): UserLedgerRecord {
    return {
        user_id: object.userId,
        update_timestamp: object.updateTimestamp ? object.updateTimestamp.toUTCString() : new Date().toUTCString(),
        user_info: {
            targeted_offers: object.targetedOffers,
            linked_offers: object.linkedOffers,
            is_enrolled: object.isEnrolledToMyOffers
        }
    };
  }

  public static deserialize(record: UserLedgerRecord): IUserLedger {
    return {
      isEnrolledToMyOffers: record.user_info.is_enrolled,
      linkedOffers: record.user_info.linked_offers,
      targetedOffers: record.user_info.targeted_offers,
      userId: record.user_id,
      updateTimestamp: new Date(record.update_timestamp)
    };
  }
}
