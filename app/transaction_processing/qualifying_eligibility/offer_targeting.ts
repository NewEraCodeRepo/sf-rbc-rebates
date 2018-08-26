import { UserRepository } from "../../database/repositories/user_repository";
import { QualifyingStrategy } from "../qualifying_strategy";
import { UserLedgerRepository } from "../../database/repositories/user_ledger_repository";
import { OfferType } from "datapipeline-schemas/salesforceObject";

export class OfferTargeting {
  public static async doesAccept(
    context: QualifyingStrategy
  ) {

    const { criteria, transaction, logger } = context;

    if (!criteria.requiresCustomerToBeTargeted || criteria.redemptionBasedOn === OfferType.PreLoadedOptInFile) {
      return true;
    }

    const userId = transaction.userId;

    logger.info('Criteria requires customer be targeted to offer');
    const transactionDate = transaction.transactionDate;
    const user = await UserRepository.find(userId);

    if (user) {
        logger.info('Customer', user.id, 'is targeted to offer');

        try {
          const userStateOnTransactionDate = await UserLedgerRepository.getStateAtDate(userId, transactionDate);
          return this.checkUserTargetingInLedger({
            userStateOnTransactionDate,
            currentOffer: criteria.id,
            userId, logger,
          });
        } catch (e) {
          logger.info('Customer', userId, 'was not targeted to offer at time of transaction');
          return false;
        }

    } else {
      logger.info('Customer', userId, 'could not be found');
      return false;
    }
  }

  private static checkUserTargetingInLedger({ userStateOnTransactionDate, currentOffer, userId, logger }) {

    // @TODO lodash?
    const isEmptyObject = ((obj) => Object.keys(obj).length === 0 && obj.constructor === Object);

    // getStateAndDate will return an empty object when a record is not found
    // with the try / catch block above
    if (!isEmptyObject(userStateOnTransactionDate)) {
      if (userStateOnTransactionDate.targetedOffers.includes(currentOffer)) {
        logger.info('Customer', userId, 'was targeted to offer at time of transaction');
        return true;
      } else {
        logger.info('Customer', userId, 'was not targeted to offer at time of transaction');
        return false;
      }
    } else {
      logger.info('Customer', userId, 'was not targeted to offer at time of transaction');
      return false;
    }
  }
}
