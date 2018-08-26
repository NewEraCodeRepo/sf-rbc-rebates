import * as faker from "faker";
import { ensureVerifiableDates } from "../../../test/support/fixtures";
import {UserSetEvent} from "datapipeline-schemas/events/userSetEvent";
import { Publisher } from "../../../test/support/kafka/publisher";

export default function buildUserEvent(attributes: Partial<UserSetEvent> = {}): any {
    ensureVerifiableDates(attributes, 'transactionDate');

    const userId = `U${faker.random.uuid()}`;

    return {
        id: userId,
        metadata: {
            createdAt: 1521554337,
            createdClientId: "test-script",
            guid: "test",
            type: "com.rbc.offer_platform.events.user_set"
        },
        user: {
            id: userId,
            name: "test user",
            targetedOfferIds: [],
            linkedOfferIds: [],
            offerViews: {},
            offerClicks: {},
            isEligible: faker.random.boolean(),
            eligibility: {
                hasEligibleAge: faker.random.boolean(),
                hasEligibleProducts: faker.random.boolean(),
                hasEligibleDDAProducts: faker.random.boolean(),
                hasEligibleCreditProducts: faker.random.boolean(),
                hasEligibleLocation: faker.random.boolean(),
                hasEligibleCPC: faker.random.boolean(),
                nonResident: faker.random.boolean(),
                isDeceased: faker.random.boolean(),
                isNationwide: faker.random.boolean(),
                isBlacklisted: faker.random.boolean(),
                status: faker.random.arrayElement(['active', 'inactive'])
            },
            enrolled: faker.random.boolean(),
            creditCardProducts: [],
            ddaProducts: [],
            alertPreferences: {}
        }
    };
}

export async function publishUserEvent(attributes: Partial<UserSetEvent> = {}) {
    const publisher = new Publisher();
    const event = buildUserEvent(attributes);
    const options = {
        topic: "users",
        key: event.id,
        message: event
    };

    publisher.dispatch(options);
    publisher.stop();

    return event;
}
