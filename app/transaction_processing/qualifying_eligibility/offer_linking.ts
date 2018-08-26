import { QualifyingStrategy } from "../qualifying_strategy";
import {UserLedgerRepository} from "../../database/repositories/user_ledger_repository";
import { OfferType } from "datapipeline-schemas/salesforceObject";
import { OwnershipType } from "datapipeline-schemas/sharedData";
import { ICreditCardProduct } from "datapipeline-schemas/userObject";

export class OfferLinking {
  public static async doesAccept(
    context: QualifyingStrategy
  ) {

    const { criteria, transaction, logger, user, product } = context;

    if (!criteria.requiresCustomerToBeLinked) {
      return true;
    }

    let userId = transaction.userId;

    logger.info('Criteria requires customer be linked to offer');

    const transactionDate = transaction.transactionDate;

    if (user) {
      if (this.shouldCheckLinkingToPrimary({ product, user, criteria })) {
        logger.info('Customer is Auth user, able to redeem, but not presented offer, checking the linking at the parent level.');
        userId = (product as ICreditCardProduct).primaryAccountHashSRF;
        if ( userId === null || userId === "" ) {
          logger.info('No primary account HSRF found, failing transaction');
          return false;
        }
      }

      try {
        const userStateOnTransactionDate = await UserLedgerRepository.getStateAtDate(userId, transactionDate);
        return this.checkUserLinkedInLedger({
          userStateOnTransactionDate,
          currentOffer: criteria.id,
          userId, logger,
        });
      } catch (e) {
        logger.info('Customer', userId, 'was not linked to offer at time of transaction');
        return false;
      }

    } else {
      logger.info('Customer', userId, 'could not be found');
      return false;
    }

  }

  // If data setup equals auth user is not presentable but is redeemable, do the linking logic with the Primary user's id
  private static shouldCheckLinkingToPrimary({ product, user, criteria }) {

    // If this is a product-based offer and the user is an auth user for the transaction
    if (criteria.redemptionBasedOn === OfferType.ProductOwnerShipBased && product.ownershipType === OwnershipType.AuthorizedUser ) {

      let productRedeemableTypes;
      for (const offerProduct in criteria.eligibleProducts) {
        if (criteria.eligibleProducts[offerProduct].productCodeExternal === product.code) {
          productRedeemableTypes = criteria.eligibleProducts[offerProduct].redeemableOwnershipType;
          break;
        }
      }

      // ...and Auth users can redeem the offer
      if ( productRedeemableTypes.includes(OwnershipType.AuthorizedUser) ) {

        let productPresentableTypes;
        for (const offerProduct in criteria.eligibleProducts) {
          if (criteria.eligibleProducts[offerProduct].productCodeExternal === product.code) {
            productPresentableTypes = criteria.eligibleProducts[offerProduct].presentableOwnershipType;
            break;
          }
        }
        // ...and the offer is presented to Primary owners, but NOT auth owners
        if ( productPresentableTypes.includes(OwnershipType.Primary) &&
            !productPresentableTypes.includes(OwnershipType.AuthorizedUser)
          ) {
            // ...then do all the logic below as the primary user
            return true;
        }
      }
    }
    return false;
  }

  private static checkUserLinkedInLedger({ userStateOnTransactionDate, currentOffer, userId, logger }) {

    // @TODO lodash?
    const isEmptyObject = ((obj) => Object.keys(obj).length === 0 && obj.constructor === Object);

    // getStateAndDate will return an empty object when a record is not found
    // with the try / catch block above
    if (!isEmptyObject(userStateOnTransactionDate)) {
      if (userStateOnTransactionDate.linkedOffers.includes(currentOffer)) {
        logger.info('Customer', userId, 'was linked to offer at time of transaction');
        return true;
      } else {
        logger.info('Customer', userId, 'was not linked to offer at time of transaction');
        return false;
      }
    } else {
      logger.info('Customer', userId, 'was not linked to offer at time of transaction');
      return false;
    }
  }
}
