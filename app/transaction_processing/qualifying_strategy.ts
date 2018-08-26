import { ILoggable } from "../interfaces/loggable";
import { CardType, ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { RebateCriteriaRepository } from "../database/repositories/rebate_criteria_repository";
import { RebateCalculation, RebateCalculationResult } from "./rebate_calculation";
import { PendingRebateIssuance } from "./pending_rebate_issuance";
import { IRebateCriteria } from "../models/rebate_criteria";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
import { OfferLinking } from "./qualifying_eligibility/offer_linking";
import { OfferProductOwnership } from "./qualifying_eligibility/offer_product_ownership";
import { OfferOptInFile} from "./qualifying_eligibility/offer_opt_in_file";
import { RedemptionLimitValidation } from "./qualifying_eligibility/redemption_limit_validation";
import { OfferRedemptionPeriod } from "./qualifying_eligibility/offer_redemption_period";
import { OfferTargeting } from "./qualifying_eligibility/offer_targeting";
import { TransactionUsed } from "./qualifying_eligibility/transaction_used";
import { Blacklist } from "./qualifying_eligibility/blacklist";
import { ProductBlockCode } from "./qualifying_eligibility/product_block_code";
import { TransactionForRebateCriteriaRepository } from "../database/repositories/transaction_for_rebate_criteria_repository";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { RedemptionLimitType } from "../interfaces/redemption_limit_type";
import { Producer } from "../kafka/producers/producer";
import { IUser } from "../models/user";
import { UserRepository } from "../database/repositories/user_repository";
import { ICreditCardProduct, IDDAProduct } from "datapipeline-schemas/userObject";

export class QualifyingStrategy {
  public static matches(transaction: ITransactionForRebateCriteria) {
    return transaction.transactionType === TransactionType.Qualifying;
  }

  public static async perform(transaction: ITransactionForRebateCriteria, kafkaStreamer: Producer, logger: ILoggable) {
    await new QualifyingStrategy(transaction, logger).perform(kafkaStreamer);
  }

  private cachedCriteria: IRebateCriteria;
  private cachedUser: IUser;
  private cachedCalculation: RebateCalculationResult;
  private cachedProduct: ICreditCardProduct | IDDAProduct;

  constructor(
    public readonly transaction: ITransactionForRebateCriteria,
    public readonly logger: ILoggable
  ) {}

  public async perform(kafkaStreamer: Producer) {

    // check offer exists
    try {
      const criteriaWasFound = await this.findCriteria();

      if (!criteriaWasFound) {
        this.logger.info('Criteria not found');
        await this.markAsIneligble(TransactionStatus.OfferNotFound);
        return;
      }
    } catch (e) {
        this.logger.error(`Offer lookup: ${e}`);
        return;
    }

    // check user exists
    try {
      const userWasFound = await this.findUser();

      if (!userWasFound) {
        this.logger.info('Client not found');
        await this.markAsIneligble(TransactionStatus.CannotFindClient);
        return;
      }
    } catch (e) {
        this.logger.error(`User lookup: ${e}`);
        return;
    }

    // check redemption period acceptance
    try {
      if (!await OfferRedemptionPeriod.doesAccept(this)) {
        await this.markAsIneligble(TransactionStatus.OfferNotWithinRedemptionPeriod);
        return;
      }
    } catch (e) {
      this.logger.error(`Redemption Period check: ${e}`);
      return;
    }

    // check if user blacklisted
    try {
      if (!await Blacklist.doesAccept(this)) {
        await this.markAsIneligble(TransactionStatus.ClientBlacklisted);
        return;
      }
    } catch (e) {
      this.logger.error(`Blacklist check: ${e}`);
      return;
    }

    // validate user has product used for transaction
    try {
      const productWasFound = this.findProduct();

      if (!productWasFound) {
        this.logger.info('Product not found');
        await this.markAsIneligble(TransactionStatus.UserProductForOfferNotFound);
        return;
      }
    } catch (e) {
      this.logger.error(`Product check: ${e}`);
      return;
    }

    // check for user block code on product used in transaction
    try {
      if (!await ProductBlockCode.doesAccept(this)) {
        await this.markAsIneligble(TransactionStatus.ProductHasBlockCode);
        return;
      }
    } catch (e) {
      this.logger.error(`Block code check: ${e}`);
      return;
    }

    // check targeting acceptance
    try {
      if (!await OfferTargeting.doesAccept(this)) {
        await this.markAsIneligble(TransactionStatus.ClientIsNotTargeted);
        return;
      }
    } catch (e) {
      this.logger.error(`Target check: ${e}`);
      return;
    }

    // check link acceptance
    try {
      if (!await OfferLinking.doesAccept(this)) {
        await this.markAsIneligble(TransactionStatus.ClientIsNotLinked);
        return;
      }
    } catch (e) {
      this.logger.error(`Link check: ${e}`);
      return;
    }

    // check redemption limit acceptance
    try {
      if (!await RedemptionLimitValidation.transactionCheck(this)) {
        let limitStatus;

        if (this.criteria.redemptionLimitType === RedemptionLimitType.PerCard) {
          limitStatus = TransactionStatus.ClientReachedCardRedLimit;
        } else {
          limitStatus = TransactionStatus.ClientReachedOverallRedLimit;
        }

        await this.markAsIneligble(limitStatus);
        return;
      }
    } catch (e) {
      this.logger.error(`Limit check: ${e}`);
      return;
    }

    // check transaction not used already
    try {
      if (!await TransactionUsed.doesAccept(this)) {
        await this.markAsIneligble(TransactionStatus.QualifiedTransUsedAlready);
        return;
      }
    } catch (e) {
      this.logger.error(`Transaction used check: ${e}`);
      return;
    }

    // check card owner has been configured to redeem offer
    try {
      if (!await OfferProductOwnership.doesAccept(this)) {
        if (this.transaction.cardType === CardType.CreditCard) {
          await this.markAsIneligble(TransactionStatus.CreditCardOwnerNotAuthorized);
        } else {
          await this.markAsIneligble(TransactionStatus.DebitCardOwnerNotAuthorized);
        }
        return;
      }
    } catch (e) {
      this.logger.error(`Ownership check: ${e}`);
      return;
    }

    // check client is in opt-in file for offer
    try {
      if (!await OfferOptInFile.doesAccept(this)) {
        await this.markAsIneligble(TransactionStatus.ClientNotInOptInFile);
        return;
      }
    } catch (e) {
      this.logger.error(`Opt-in file check: ${e}`);
      return;
    }

    // rebate issuance
    try {
      this.explainRebateCalculation();

      if (this.rebateAmountIsZero()) {
        await this.markAsNoRebateDue();
      } else {
        await this.issueRebate(kafkaStreamer);
      }
    } catch (e) {
      this.logger.error(`Rebate Issuance: ${e}`);
      return;
    }
  }

  public get criteria() {
    return this.cachedCriteria;
  }

  public get user() {
    return this.cachedUser;
  }

  public get product() {
    return this.cachedProduct;
  }

  private get rebateAmount() {
    return this.calculation.amount;
  }

  private get rewardType() {
    return this.criteria.rewardCalculation.unit;
  }

  private rebateAmountIsZero() {
    return this.rebateAmount.eq(0);
  }

  private async issueRebate(kafkaStreamer: Producer) {
    const issuance = new PendingRebateIssuance(
      this.transaction,
      this.rebateAmount,
      this.rewardType
    );

    await this.markAsProcessed(TransactionStatus.RebateCreated);

    await issuance.perform();

    this.logger.info(`Issued a ${issuance.amount.toFixed(2)} ${issuance.rewardType} rebate`);
  }

  private get rebateCriteriaId() {
    return this.transaction.rebateCriteriaId;
  }

  private async findCriteria() {
    const criteria = await RebateCriteriaRepository.find(this.rebateCriteriaId);

    if (criteria) {
      this.cachedCriteria = criteria;
    }

    return criteria;
  }

  private async findUser() {
    const user = await UserRepository.find(this.transaction.userId);
    if (user) {
      this.cachedUser = user;
    }
    return user;
  }

  private findProduct(): ICreditCardProduct | IDDAProduct {

    let products;

    if (this.transaction.cardType === CardType.CreditCard) {
      products = this.user.creditCardProducts;
    } else if (this.transaction.cardType === CardType.CheckingAccount)  {
      products = this.user.debitCardProducts;
    } else {
      throw new Error(`[RM] Card type ${this.transaction.cardType} not recognized`);
    }

    const product = products.filter((productSearch) =>
      productSearch.code === this.transaction.productCodeExternal &&
      productSearch.accountId === this.transaction.accountId
    )[0];

    if (product) {
      this.cachedProduct = product;
    }

    return product;
  }

  private explainRebateCalculation() {
    this.logger.info(this.calculation.explanation);
  }

  private async markAsIneligble(status: TransactionStatus) {
    await this.markAsProcessed(status);
    this.logger.info('Rebate criteria was not met, no rebate issued');
  }

  private async markAsNoRebateDue() {
    await this.markAsProcessed(TransactionStatus.RebateNotDue);
    this.logger.info('Rebate amount is zero, no rebate issued');
  }

  private async markAsProcessed(status: TransactionStatus) {
    const attributesToUpdate = { processedAt: new Date(), status };

    try {
      await TransactionForRebateCriteriaRepository.update(
        this.transaction.id,
        attributesToUpdate
      );

      Object.assign(this.transaction, attributesToUpdate);
    } catch (e) {
      this.logger.error("Error in marking transaction as processed: ", e);
    }
  }

  private get calculation() {
    if (!this.cachedCalculation) {
      this.cachedCalculation = new RebateCalculation(
        this.transaction,
        this.criteria.rewardCalculation
      ).result;
    }

    return this.cachedCalculation;
  }
}
