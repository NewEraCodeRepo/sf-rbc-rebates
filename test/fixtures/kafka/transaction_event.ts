import * as faker from "faker";
import { dateAppropriateForTesting, ensureVerifiableDates, randomAmount } from "../../../test/support/fixtures";
import { maskedCardNumber } from "../../../test/support/masked_card_number";
import {TransactionSetEvent} from "datapipeline-schemas/events/transactionSetEvent";
import { Publisher } from "../../../test/support/kafka/publisher";

export default function buildTransactionEvent(attributes: Partial<TransactionSetEvent> = {}): any {
    ensureVerifiableDates(attributes, 'transactionDate');

    const transactionId = `T${faker.random.uuid()}`;

    return {
        id: transactionId,
        metadata: {
            createdAt: 1521554337,
            createdClientId: "test-script",
            guid: "test",
            type: "com.rbc.offer_platform.events.transaction_set"
        },
        transaction: {
            transactionId,
            userId: `CL${faker.random.uuid()}`,
            offerId: `RC${faker.random.uuid()}`,
            type: faker.random.number({ min: 1, max: 3 }),
            card: maskedCardNumber,
            cardType: faker.random.number({ min: 1, max: 2 }),
            amount: randomAmount(),
            basePoints: faker.random.number(),
            transactionDate: dateAppropriateForTesting(faker.date.recent(10)),
            rebateId: `RE${faker.random.uuid()}`,
            accountId: `A${faker.random.uuid()}`,
            currency: "CAD",
            postalCode: faker.address.zipCode().toString(),
            productCode: faker.random.arrayElement(['MC6', 'PLP', 'RVG', 'CHB', 'GPR', 'CLO']),
            isManual: faker.random.boolean(),
        },
        ...attributes
    };
}

export async function publishTransactionEvent(attributes: Partial<TransactionSetEvent> = {}) {
    const publisher = new Publisher();
    const event = buildTransactionEvent(attributes);
    const options = {
        topic: "transactions",
        key: event.id,
        message: event
    };

    publisher.dispatch(options);
    publisher.stop();

    return event;
}
