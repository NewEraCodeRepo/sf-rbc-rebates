import { FulfillmentContext } from "./context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export interface FulfillmentState {
    status: TransactionStatus;
    matches: (context: FulfillmentContext) => Promise<boolean>;
}
