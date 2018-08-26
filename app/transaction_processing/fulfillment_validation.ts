import { FulfillmentContext } from "./fulfillment/context";
import states from "./fulfillment/states";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { ILoggable } from "../interfaces/loggable";

export class FulfillmentValidation {
    constructor(
        public readonly context: FulfillmentContext
    ) {}

    public async result(logger: ILoggable): Promise<TransactionStatus> {
        let status = TransactionStatus.UnknownIssue;

        for (const i in states) {
            if (await states[i].matches(this.context)) {
                status = states[i].status;
                break;
            }
        }

        if (status === TransactionStatus.UnknownIssue) {
            throw new Error(`Cannot determine the state of ${JSON.stringify(this.context)}`);
        }

        return status;
    }
}
