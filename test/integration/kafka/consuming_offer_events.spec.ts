import { expect } from "chai";
import { requiresDatabase } from "../../support/database";
// import { lastKafkaEvent, requiresKafka } from "../../support/kafka";
// import { TestLogger } from "../../support/test_logger";
import { publishOfferEvent } from "../../fixtures/kafka/offer_event";
import { RebateCriteriaRepository } from "../../../app/database/repositories/rebate_criteria_repository";
import { Consumer} from "../../../app/kafka/consumers/consumer";

describe("Consuming offer events @kafka", () => {
    requiresDatabase();
    // requiresKafka();

    const consumer = new Consumer("offers");

    before(() => {
        consumer.start();
    });

    after(() => {
        // TODO - this doesn't stop test & runs forever
        consumer.stop();
    });

    it("can consume a redeemable offer event from kafka topic & populate db", async () => {
        // publish new offer event
        const offerEvent = await publishOfferEvent({
            isRedeemable: true
        });

        // get last event received by consumer
        const lastEvent = await consumer.lastEvent;
        // console.log(lastEvent.offer);

        // get last database insert by consumer
        const lastDBInsert = await consumer.lastDBInsert;

        // retrieve last offer directly from database
        const lastOffer = await RebateCriteriaRepository.last();

        // assert that data matches
        expect(offerEvent.id).to.eq(lastEvent.offer.id).to.eq(lastDBInsert.id).to.eq(lastOffer.id);

    }).timeout(45000);

    it("can handle a duplicate event");
});
/* TODO
   1) Database constraint to ensure we can handle duplicate events
   2) Idempotent - need to program for this
   3) How to handle if broker goes down - how can we replay events? */
