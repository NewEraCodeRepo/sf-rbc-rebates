import { QualifyingStrategy } from "../qualifying_strategy";
import { RedemptionLimitType } from "../../interfaces/redemption_limit_type";
import { IRequiredPropertiesToCheckForRedemption } from "../../interfaces/required_properties_to_check_for_redemption";
import { RebateRepository } from "../../database/repositories/rebate_repository";
import { ILoggable } from "../../interfaces/loggable";

export class RedemptionLimitValidation {

  public static async transactionCheck(context: QualifyingStrategy) {
    const { criteria, transaction, logger } = context;
    this.logger = logger;

    const propertiesToCheck: IRequiredPropertiesToCheckForRedemption = {
        userId: transaction.userId,
        rebateCriteriaId: transaction.rebateCriteriaId,
        redemptionLimit: criteria.redemptionLimit,
        redemptionType: criteria.redemptionLimitType
    };

    if (criteria.redemptionLimitType === RedemptionLimitType.PerCard) {
      propertiesToCheck.card = transaction.card;
    }

    this.validatePropertiesWithLogMessage({ propertiesToCheck });
    const rebates = await this.getRebatesByRedemptionLimitType(transaction, criteria.redemptionLimitType);
    return this.checkRebateCanBeRedeemed({ numberOfRebates: rebates.length, criteria, transaction });
  }

  private static logger: ILoggable;

  private static async checkRebateCanBeRedeemed({ numberOfRebates, criteria, transaction }) {
    if (numberOfRebates < criteria.redemptionLimit || criteria.redemptionLimit === 0) {
      this.logger.info('Transaction', transaction.transactionId, 'can be redeemed');
      return true;
    } else {
      this.logger.info('Transaction', transaction.transactionId, 'cannot be redeemed');
      this.logger.info('User exceeded redemption limits');
      return false;
    }
  }

  private static async getRebatesByRedemptionLimitType(transaction, redemptionLimitType) {

    const rebateCriteria = {
      userId: transaction.userId,
      rebateCriteriaId: transaction.rebateCriteriaId,
      limitType: redemptionLimitType
    };

    if (redemptionLimitType && redemptionLimitType === RedemptionLimitType.PerCard) {
      Object.assign(rebateCriteria, { card: transaction.card });
    }

    return await RebateRepository.findRebatesForUserForRebateCriteria(rebateCriteria);
  }

  private static validatePropertiesWithLogMessage({ propertiesToCheck }): any {
    Object.keys(propertiesToCheck).forEach((key) => {
      if (!propertiesToCheck[key]) {
        this.logger.info(`${key} is required`);
        return false;
      }
    });
  }
}
