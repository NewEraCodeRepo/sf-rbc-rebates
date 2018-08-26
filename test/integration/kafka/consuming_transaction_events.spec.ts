import { expect } from "chai";
import { requiresDatabase } from "../../support/database";
// import { lastKafkaEvent, requiresKafka } from "../../support/kafka";
// import { TestLogger } from "../../support/test_logger";
import { publishTransactionEvent } from "../../fixtures/kafka/transaction_event";
import { TransactionForRebateCriteriaRepository } from "../../../app/database/repositories/transaction_for_rebate_criteria_repository";
import { Consumer} from "../../../app/kafka/consumers/consumer";

describe("Consuming transaction events @kafka", () => {
    requiresDatabase();
    // requiresKafka();

    const consumer = new Consumer("transactions");

    before(() => {
        consumer.start();
    });

    after(() => {
        consumer.stop();
    });

    it("can consume a transaction event from kafka topic & populate db", async () => {
        // publish new transaction event
        const transactionEvent = await publishTransactionEvent();
        // console.log(transactionEvent);

        // get last event received by consumer
        const lastEvent = await consumer.lastEvent;
        // console.log(lastEvent.transaction);

        // get last database insert by consumer
        const lastDBInsert = await consumer.lastDBInsert;

        // retrieve last transaction directly from database
        const lastTransaction = await TransactionForRebateCriteriaRepository.last();

        // assert that data matches
        expect(transactionEvent.id).to.eq(lastEvent.transaction.transactionId).to.eq(lastDBInsert.transactionId).to.eq(lastTransaction.transactionId);

    }).timeout(45000);

    it("can handle a duplicate event");
});
/* TODO
   1) Database constraint to ensure we can handle duplicate events
   2) Idempotent - need to program for this
   3) How to handle if broker goes down - how can we replay events? */
