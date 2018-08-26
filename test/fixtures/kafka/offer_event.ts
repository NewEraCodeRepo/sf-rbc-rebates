import * as faker from "faker";
import { dateAppropriateForTesting, ensureVerifiableDates } from "../../../test/support/fixtures";
import { Publisher } from "../../../test/support/kafka/publisher";
import { OfferBenefitToCustomer } from "../../../app/interfaces/offer_benefit_to_customer";
import { RedemptionLimitType } from "../../../app/interfaces/redemption_limit_type";
import { randomEnumValue } from "../../../test/support/random_enum_value";
import {IOfferDocument} from "datapipeline-schemas/sharedData";

export default function buildOfferEvent(attributes: Partial<IOfferDocument> = {}): any {
    ensureVerifiableDates(attributes, 'transactionDate');

    const offerId = `O${faker.random.uuid()}`;

    return {
        id: offerId,
        metadata: {
            createdAt: 1511192333184,
            createdClientId: "projectors.offers.producer",
            guid: "test",
            type: "com.rbc.offer_platform.events.offer_set"
        },
        offer: {
            id: offerId,
            name: "test offer",
            bannerClickDirection: "Same Tab",
            bannerSchedulerTimeJSON: null,
            barCode: null,
            barCodeType: null,
            benefitToCustomer: randomEnumValue(OfferBenefitToCustomer),
            campaignEndDate: dateAppropriateForTesting(faker.date.recent(10)),
            campaignStartDate: dateAppropriateForTesting(faker.date.future(2)),
            clickLimit: null,
            description: null,
            descriptionFr: null,
            displayNameEn: "test En",
            displayNameFr: "test Fr",
            isEmergencyInterceptOffer: faker.random.boolean(),
            isFeatured: faker.random.boolean(),
            isInterceptOffer: faker.random.boolean(),
            isLandingPageModal: faker.random.boolean(),
            isODReady: faker.random.boolean(),
            isPresentment: faker.random.boolean(),
            isReadyToUseByClient: faker.random.boolean(),
            isRedeemable: faker.random.boolean(),
            isTargeted: faker.random.boolean(),
            isTrackingRefunds: faker.random.boolean(),
            isWMReady: faker.random.boolean(),
            longTCEnglish: null,
            longTCFrench: null,
            merchantId: `M${faker.random.uuid()}`,
            merchantURL: null,
            merchantURLFR: null,
            numOfDaysDisplayLimitApplies: null,
            numOfDaysToWatchAndMatch: faker.random.number({ min: 0, max: 30 }),
            numOfTimesOfferDisplayed: null,
            offerId: `O${faker.random.uuid()}`,
            program: "myOffers",
            promoCode: null,
            ranking: faker.random.number({ min: 1, max: 10 }),
            rebateAmount: faker.random.number({ min: 1, max: 10 }),
            redemptionEvent: "transaction",
            redemptionLimit: faker.random.number({ min: 1, max: 10 }),
            redemptionLimitType: randomEnumValue(RedemptionLimitType),
            refundPeriod: faker.random.number({ min: 0, max: 30 }),
            requiresEnrollment: faker.random.boolean(),
            requiresLinkToProfile: faker.random.boolean(),
            runningLinkToProfileCount: null,
            runningPotentialSavingsAmount: null,
            runningRedemptionAmount: null,
            shortDescription: null,
            shortDescriptionFr: null,
            shortTCEnglish: null,
            shortTCFrench: null,
            status: "Active",
            urlEn: null,
            urlFr: null,
            validFromDate: dateAppropriateForTesting(faker.date.recent(10)),
            validToDate: dateAppropriateForTesting(faker.date.future(2)),
            categories: {},
            creatives: {},
            products: {},
            ...attributes
        }
    };
}

export async function buildOfferEventReceived(attributes: Partial<IOfferDocument> = {}) {
    ensureVerifiableDates(attributes, 'transactionDate');

    const event = buildOfferEvent(attributes);

    return {
        event,
        key: event.offer.id,
        offset: faker.random.number({ min: 1, max: 10 }),
    };
}

export async function publishOfferEvent(attributes: Partial<IOfferDocument> = {}) {
    const publisher = new Publisher();
    const event = buildOfferEvent(attributes);
    const options = {
        topic: "offers",
        key: event.id,
        message: event
    };

    publisher.dispatch(options);
    publisher.stop();

    return event;
}
