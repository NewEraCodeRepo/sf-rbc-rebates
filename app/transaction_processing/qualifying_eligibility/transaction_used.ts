import { RebateRepository } from "../../database/repositories/rebate_repository";
import { QualifyingStrategy } from "../qualifying_strategy";
import { Validator } from "class-validator";
const validator = new Validator();

export class TransactionUsed {
    public static async doesAccept(
        context: QualifyingStrategy
    ) {

        const { transaction, logger } = context;

        const transactionId = transaction.userId;

        const otherRebatesUsingTransaction = await RebateRepository.findAll({
            where: { account_transaction_id: context.transaction.transactionId }
        });

        if (validator.arrayNotEmpty(otherRebatesUsingTransaction)) {
            const rebateId = otherRebatesUsingTransaction[0].id;

            logger.info('Transaction', transactionId, 'has been used already against rebate:', rebateId);
            return false;
        } else {
            return true;
        }
    }
}
