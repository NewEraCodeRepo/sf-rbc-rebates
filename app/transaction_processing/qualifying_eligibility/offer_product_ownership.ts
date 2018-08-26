import { QualifyingStrategy } from "../qualifying_strategy";
import {OfferType} from "datapipeline-schemas/salesforceObject";
import {IRebateCriteria} from "../../models/rebate_criteria";
import { ITransactionForRebateCriteria } from "../../../node_modules/datapipeline-schemas/rebateManagementObject";

export class OfferProductOwnership {
  public static async doesAccept(context: QualifyingStrategy) {

    const { criteria, logger, user, product, transaction } = context;

    if (criteria.redemptionBasedOn !== OfferType.ProductOwnerShipBased) {
      return true;
    }

    logger.info('Criteria requires product ownership check');

    const offerOwnershipTypes = this.getOfferOwnershipTypes(criteria, transaction, product.code, product.accountId);

    // accept if card ownership type is configured on offer
    if (offerOwnershipTypes && offerOwnershipTypes.includes(product.ownershipType)) {
      logger.info('Customer', user.id, 'authorized to use product', product.code, 'for redemption');
      return true;
    } else {
      logger.info('Customer', user.id, 'not authorized to use product', product.code, 'for redemption');
      return false;
    }
  }

  private static getOfferOwnershipTypes(criteria: IRebateCriteria, transaction: ITransactionForRebateCriteria, userProductCode: string, userProductAccountId: string): string {
    let offerOwnershipTypes;
    const offerProducts = criteria.eligibleProducts;

    for (const offerProduct in offerProducts) {
      if (offerProducts[offerProduct].productCodeExternal === userProductCode
        && transaction.accountId === userProductAccountId
      ) {
        offerOwnershipTypes = offerProducts[offerProduct].redeemableOwnershipType;
        break;
      }
    }

    return offerOwnershipTypes;
  }
}
