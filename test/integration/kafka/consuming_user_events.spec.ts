import { expect } from "chai";
import { requiresDatabase } from "../../support/database";
// import { lastKafkaEvent, requiresKafka } from "../../support/kafka";
// import { TestLogger } from "../../support/test_logger";
import { publishUserEvent } from "../../fixtures/kafka/user_event";
import { UserRepository } from "../../../app/database/repositories/user_repository";
import { Consumer } from "../../../app/kafka/consumers/consumer";

describe("Consuming user events @kafka", () => {
    requiresDatabase();
    // requiresKafka();

    const consumer = new Consumer("users");

    before(() => {
        consumer.start();
    });

    after(() => {
        consumer.stop();
    });

    it("can consume a user event from kafka topic & populate db", async () => {
        // publish new user event
        const userEvent = await publishUserEvent();
        // console.log(userEvent);

        // get last event received by consumer
        const lastEvent = await consumer.lastEvent;
        // console.log(lastEvent);

        // get last database insert by consumer
        const lastDBInsert = await consumer.lastDBInsert;

        // retrieve last user directly from database
        const lastUser = await UserRepository.last();

        // assert that data matches
        expect(userEvent.id).to.eq(lastEvent.user.id).to.eq(lastDBInsert.id).to.eq(lastUser.id);

    }).timeout(45000);

    it("can handle a duplicate event");
});

/* TODO
   1) Database constraint to ensure we can handle duplicate events
   2) Idempotent - need to program for this
   3) How to handle if broker goes down - how can we replay events? */
