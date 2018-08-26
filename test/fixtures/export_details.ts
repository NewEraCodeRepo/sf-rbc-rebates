import * as faker from "faker";
import { ITransferDetails } from "../../app/models/transfer_details";
import { randomEnumValue } from "../support/random_enum_value";
import { TransferStatus } from "../../app/interfaces/transfer_status";
import { ensureVerifiableDates, dateAppropriateForTesting } from "../support/fixtures";

export default function(attributes: any = {}): ITransferDetails {
    ensureVerifiableDates(attributes, 'startedAt', 'finishedAt');

    return {
        id: faker.random.number().toString(),
        startedAt: dateAppropriateForTesting(),
        finishedAt: dateAppropriateForTesting(),
        status: randomEnumValue(TransferStatus),
        numberOfItems: faker.random.number(),
        ...attributes
    };
}
