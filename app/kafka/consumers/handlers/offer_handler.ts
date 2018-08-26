import { OfferSetEvent, OfferSetEventSerde } from "datapipeline-schemas/events/offerSetEvent";
import { IDelivery } from "datapipeline-lib";
import { ILoggable } from "../../../../app/interfaces/loggable";
import { RebateCriteriaRepository } from "../../../../app/database/repositories/rebate_criteria_repository";
import { KafkaOfferSerializer } from "../../serializers/offer_serializer";

export class OfferHandler {
  public static matches(name: string) {
    return name === "offers";
  }

  public static getEventSerde(clientId: string) {
    return new OfferSetEventSerde(clientId);
  }

  public static async process(message: IDelivery<OfferSetEvent>, logger: ILoggable) {
    if (message.event && message.event.offer && message.event.offer.isRedeemable && message.event.offer.wasActive) {
      const offerEvent = message.event.offer;
      const offerData = KafkaOfferSerializer.serialize(offerEvent);
      const offerRecord = await RebateCriteriaRepository.upsert(offerData);

      logger.info(`[RM status] - Offer upserted: ${offerRecord.id}`);

      return offerRecord;
    } else if (message.event && message.event.offer) {
      logger.info(`[RM status] - Offer not activated or redeemable: ${message.event.offer.id}`);
    } else {
      logger.info(`[RM status] - Offer message invalid: ${message}`);
    }
  }
}
