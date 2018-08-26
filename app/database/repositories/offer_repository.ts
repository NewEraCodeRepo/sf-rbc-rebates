import { OfferRecord } from "../salesforce_records/offer_record";
import { OfferSerializer } from "../serializers/offer_serializer";
import { RebateRepository } from "./rebate_repository";
import { RebateCriteriaRepository } from "./rebate_criteria_repository";
import { IOffer } from "../../models/offer";
import { Repository } from "./repository";

class RepositoryForOffers extends Repository<IOffer> {
  constructor(record = OfferRecord, serializer = OfferSerializer) {
    super(record, serializer, 'heroku_connect');
  }

  public async syncTotalsToMOP() {
    // Get all RebateCriterias in the system
    const rebateCriterias = await RebateCriteriaRepository.findAll();

    // for each rebateCriteria, get the count and sum values
    const rebateCriteriaIdsWithTotals = await Promise.all(rebateCriterias.map(async (rebateCriteria) => {

        const count = await RebateRepository.totalRedeemedCountForUpdate(rebateCriteria.id);
        const sum = await RebateRepository.totalRedeemedSumForUpdate(rebateCriteria.id);

        return {count, sum, rebateCriteriaId: rebateCriteria.id };
      }));

    // when you have the count and sum, update the Offer__c record with that value
    await Promise.all(rebateCriteriaIdsWithTotals.map(async (idWithTotals) => {
        // TypeORM can't handle += type operations gracefully, so need to do raw SQL
        await this
              .connection
              .query(`
                UPDATE "salesforce"."offer__c"
                SET
                  "running_redemption_amount_v3__c" = (COALESCE(running_redemption_amount_v3__c, 0) + ${idWithTotals.sum}),
                  "running_redemption_count__c" = (COALESCE(running_redemption_count__c, 0) + ${idWithTotals.count})
                WHERE "offer_id__c" = '${idWithTotals.rebateCriteriaId}';
              `);

        // after a successful update, update the rebates to be synced with MOP
        await RebateRepository.setRebatesAsSynced(idWithTotals.rebateCriteriaId);
      }));

    return true;
  }

}

export const OfferRepository = new RepositoryForOffers();
