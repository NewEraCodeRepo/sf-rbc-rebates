import { RebateRecord } from "../records/rebate_record";
import { RebateSerializer } from "../serializers/rebate_serializer";
import { RebateExportSerializer } from "../serializers/rebate_export_serializer";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { IRebate } from "../../models/rebate";
import { Repository } from "./repository";
import { Big } from "big.js";
import { RedemptionLimitType } from "../../interfaces/redemption_limit_type";

class RepositoryForRebates extends Repository<IRebate> {
  constructor(record = RebateRecord, serializer = RebateSerializer) {
    super(record, serializer);
  }

  // TODO - add unit tests for below methods
  public async findQualifyingTransactions(transaction: ITransactionForRebateCriteria) {
    return await RebateRepository.findAll({
        where: {
          rebate_criteria_id: transaction.rebateCriteriaId,
          user_id: transaction.userId
        }
    });
  }

  public async totalRedeemedCountForUpdate(rebateCriteriaId: string) {
    return await this.count({
        where: {
            rebate_criteria_id: rebateCriteriaId,
            status: TransactionStatus.FulfilledTransSuccessful,
            last_mop_sync: null
        }
    });
  }

  public async totalRedeemedCount(rebateCriteriaId: string) {
    return await this.count({
        where: {
            rebate_criteria_id: rebateCriteriaId,
            status: TransactionStatus.FulfilledTransSuccessful
        }
    });
  }

  public async totalRedeemedSumForUpdate(rebateCriteriaId: string) {
    const whereClause = `rebate_criteria_id = :id
        and last_mop_sync is null
        and status = :fulfilledTransSuccessful`;

    return this.callRedeemedSum(rebateCriteriaId, whereClause);
  }

  public async totalRedeemedSum(rebateCriteriaId: string) {
    const whereClause = `rebate_criteria_id = :id
        and status = :fulfilledTransSuccessful`;

    return this.callRedeemedSum(rebateCriteriaId, whereClause);
  }

  public async setRebatesAsSynced(rebateCriteriaId: string) {
    return await this.updateWhere({ rebateCriteriaId, status: TransactionStatus.FulfilledTransSuccessful }, { lastMopSync: new Date() });
  }

  public async findRebatesForUserForRebateCriteria({ userId, rebateCriteriaId, status, limitType, card }:
    { userId: string, rebateCriteriaId: string, card?: string, status?: string, limitType?: string }) {

    const criteria = {
      rebate_criteria_id: rebateCriteriaId,
      user_id: userId
    };

    if (status) {
      Object.assign(criteria, { status });
    }

    if (limitType && limitType === RedemptionLimitType.PerCard) {
      Object.assign(criteria, { card });
    }

    return await RebateRepository.findAll({
        where: criteria
    });
  }

  public async rebatesPendingExportStart() {
      await RebateRepository
          .connection
          .createQueryBuilder()
          .update("rebates")
          .set({
              status: TransactionStatus.ExtractionStarted
          })
          .where(`status = '${TransactionStatus.PendingExtraction}'`)
          .execute();

      const rebatesToExport = await RebateRepository.findAll({
          where: {
              status: TransactionStatus.ExtractionStarted,
          }
      });

      return rebatesToExport.map((rebate) => RebateExportSerializer.serialize(rebate));
  }

  public async resetRebatesOnError() {
      const result =  await RebateRepository
          .connection
          .createQueryBuilder()
          .update("rebates")
          .set({
              status: TransactionStatus.PendingExtraction
          })
          .where(`status = '${TransactionStatus.ExtractionStarted}'`)
          .execute();

      return result;
  }

  public async displayRebatesPendingExport() {
        return await RebateRepository.findAll({
            where: {
                status: TransactionStatus.PendingExtraction,
            }
        });
  }

  public async getRebatesPendingExport(): Promise<IRebate[]> {
      return await RebateRepository.findAll({
        status: TransactionStatus.ExtractionStarted
      });
  }

  public async rebatesPendingExportEnd(): Promise<string[]> {
        const rawResult = await RebateRepository
          .connection
          .createQueryBuilder()
          .update("rebates")
          .set({
              status: TransactionStatus.PendingFulfillment,
              delivered_at: new Date()
          })
          .where(`status = '${TransactionStatus.ExtractionStarted}'`)
          .returning('id')
          .execute();

        return rawResult.raw.map((idObj) => idObj.id);
  }

  private async callRedeemedSum(rebateCriteriaId: string, whereClause: string) {
    const result = await this
            .connection
            .createQueryBuilder()
            .select("SUM(fulfilled_amount)")
            .from("rebates", "rebates")
            .where(whereClause, {id: rebateCriteriaId, fulfilledTransSuccessful: TransactionStatus.FulfilledTransSuccessful })
            .execute();

    if (result[0]) {
        return result[0].sum === null ? "0.00" : new Big(result[0].sum).toFixed(2);
    }

    return new Big(0).toFixed(2);
  }
}

export const RebateRepository = new RepositoryForRebates();
