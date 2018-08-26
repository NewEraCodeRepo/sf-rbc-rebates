import { IUserData } from "datapipeline-schemas/userObject";
import { IUser } from "../../../app/models/user";

export class KafkaUserSerializer {
    public static serialize(object: IUserData): IUser {
        return {
            id: object.id,
            linkedOfferIds: object.linkedOfferIds,
            targetedOfferIds: object.targetedOfferIds,
            optInFileOffers: object.optInFileOffers,
            isEnrolled: object.enrolled,
            isBlacklisted: object.eligibility.isBlacklisted,
            creditCardProducts: object.creditCardProducts,
            debitCardProducts: object.ddaProducts
        };
    }
}
