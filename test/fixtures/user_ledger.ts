import * as faker from "faker";
import { IUserLedger } from "../../app/models/user_ledger";
import { UserLedgerRepository } from "../../app/database/repositories/user_ledger_repository";
import {dateAppropriateForTesting, ensureVerifiableDates} from "../support/fixtures";
import * as moment from "moment";

export default function buildUserLedger(attributes: Partial<IUserLedger> = {}): IUserLedger {
  ensureVerifiableDates(attributes, 'updateTimestamp');
  return {
    updateTimestamp: dateAppropriateForTesting(moment.utc().toDate()),
    userId: faker.random.uuid().toString(),
    isEnrolledToMyOffers: false,
    targetedOffers: [],
    linkedOffers: [],
    ...attributes
  };
}

export async function createUserLedger(attributes: Partial<IUserLedger> = {}) {
  return await UserLedgerRepository.insert(buildUserLedger(attributes));
}
