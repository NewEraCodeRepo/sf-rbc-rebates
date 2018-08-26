import { QualifyingStrategy } from "../qualifying_strategy";
import { OfferType } from "datapipeline-schemas/salesforceObject";
import { CardType } from "datapipeline-schemas/rebateManagementObject";

export class OfferOptInFile {
  public static async doesAccept(
    context: QualifyingStrategy
  ) {

    const { criteria, transaction, user, logger } = context;

    if (criteria.redemptionBasedOn !== OfferType.PreLoadedOptInFile) {
      return true;
    }

    logger.info('Criteria requires customer to be in opt-in file');

    const optInRecords = user.optInFileOffers;

    const filteredOptInRecords = optInRecords.filter((optInRecord) => {
      const offerEligible = optInRecord.offers.includes(criteria.id);

      if (transaction.cardType === CardType.CreditCard) {
        return offerEligible && optInRecord.tsysAccountId === transaction.accountId && optInRecord.tsysCustomerId === transaction.tsysCustomerId;
      } else if (transaction.cardType === CardType.CheckingAccount) {
        return offerEligible && optInRecord.tsysAccountId === transaction.accountId;
      } else {
        throw new Error(`[RM] Card type ${transaction.cardType} not recognized`);
      }
    });

    if (filteredOptInRecords.length > 0) {
      logger.info('Customer', user.id, 'was found in opt-in file for offer', criteria.id);
      return true;
    } else {
      // Check if the primary user for the auth card is opted-in
      logger.info('Customer', user.id, 'was not found in opt-in file for offer', criteria.id);
      return false;
    }
  }

}
