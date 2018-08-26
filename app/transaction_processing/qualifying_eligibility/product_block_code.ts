import { QualifyingStrategy } from "../qualifying_strategy";

export class ProductBlockCode {
    public static async doesAccept(
      context: QualifyingStrategy
    ) {
        const { logger, user, transaction, product } = context;

        logger.info('Checking for block code on product-account');

        if (product.isEligibleClientProduct === "1") {
            logger.info('Customer', user.id, 'does not have a block code on product', transaction.productCodeExternal, ', account', transaction.accountId);
            return true;
        } else if (product.isEligibleClientProduct === "0") {
            logger.info('Customer', user.id, 'has a block code on product', transaction.productCodeExternal, ', account', transaction.accountId);
            return false;
        } else {
            logger.info('Customer', user.id, 'does not have this product', transaction.productCodeExternal, ', account', transaction.accountId);
            return false;
        }
    }
}
