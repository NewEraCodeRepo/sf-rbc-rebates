import { RefundContext } from "./refund/context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import states from "./refund/states";

export class RefundValidation {
    constructor(
        public readonly context: RefundContext,
    ) {}

    public async result(): Promise<TransactionStatus> {
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
