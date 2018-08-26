import * as faker from "faker";
import { IOffer } from "../../app/models/offer";
import { OfferRepository } from "../../app/database/repositories/offer_repository";

export default function buildOffer(attributes: Partial<IOffer> = {}): IOffer {
  return {
    id: faker.random.number(2000).toString(),
    isDeleted: false,
    name: faker.random.uuid(),
    offerId: faker.random.alphaNumeric(20),
    runningRedemptionAmount: null,
    runningRedemptionCount: null,
    sfId: faker.random.alphaNumeric(17),
    ...attributes
  };
}

export async function createOffer(attributes: Partial<IOffer> = {}) {
  return await OfferRepository.insert(buildOffer(attributes));
}
