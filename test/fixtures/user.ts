import * as faker from "faker";
import { IUser } from "../../app/models/user";
import { UserRepository } from "../../app/database/repositories/user_repository";
import {createCreditCardProduct, createDebitCardProduct} from "./product_based";

export default function buildUser(attributes: Partial<IUser> = {}): IUser {
  return {
    id: `U${faker.random.uuid()}`,
    linkedOfferIds: [],
    targetedOfferIds: [],
    optInFileOffers: [],
    isEnrolled: faker.random.boolean(),
    isBlacklisted: false,
    creditCardProducts: [createCreditCardProduct()],
    debitCardProducts: [createDebitCardProduct()],
    ...attributes
  };
}

export async function createUser(attributes: Partial<IUser> = {}) {
  return await UserRepository.insert(buildUser(attributes));
}
