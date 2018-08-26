import {ICreditCardProduct, IDDAProduct, IOptInFileOffer} from "datapipeline-schemas/userObject";

export interface IUser {
  id: string;
  linkedOfferIds: string[];
  targetedOfferIds: string[];
  optInFileOffers: IOptInFileOffer[];
  isEnrolled: boolean;
  isBlacklisted: boolean;
  creditCardProducts: ICreditCardProduct[];
  debitCardProducts: IDDAProduct[];
}
