import { expect } from "chai";
import "mocha";
import { requiresDatabase } from "../support/database";
import {buildOfferEventReceived} from "../fixtures/kafka/offer_event";
import { OfferHandler } from "../../app/kafka/consumers/handlers/offer_handler";
import { RebateCriteriaRepository } from "../../app/database/repositories/rebate_criteria_repository";

describe("Imports offers via kafka", () => {
    requiresDatabase();

    it("imports a redeemable offer", async () => {
        const offerEvent = await buildOfferEventReceived({
            isRedeemable: true,
            wasActive: true
        });

        await OfferHandler.process(offerEvent, console);

        // retrieve last offer directly from database
        const lastOffer = await RebateCriteriaRepository.last();

        expect(lastOffer.id).to.eq(offerEvent.event.id);
    });

    it("doesn't import a non-redeemable offer", async () => {
        const offerEvent = await buildOfferEventReceived({
            isRedeemable: false,
            wasActive: true
        });

        await OfferHandler.process(offerEvent, console);

        // verify offer wasn't inserted
        const offers = await RebateCriteriaRepository.findAll();

        expect(offers.length).to.eq(0);
    });

    it("imports an offer that was active at some point in time", async () => {
        const offerEvent = await buildOfferEventReceived({
            isRedeemable: true,
            wasActive: true
        });

        await OfferHandler.process(offerEvent, console);

        // retrieve last offer directly from database
        const lastOffer = await RebateCriteriaRepository.last();

        expect(lastOffer.id).to.eq(offerEvent.event.id);
    });

    it("doesn't import an offer that hasn't been activated", async () => {
        const offerEvent = await buildOfferEventReceived({
            isRedeemable: true,
            wasActive: false
        });

        await OfferHandler.process(offerEvent, console);

        // verify offer wasn't inserted
        const offers = await RebateCriteriaRepository.findAll();

        expect(offers.length).to.eq(0);
    });
});
