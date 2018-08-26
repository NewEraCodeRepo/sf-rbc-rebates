import { RefundContext } from "./context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";

export interface RefundState {
    status: TransactionStatus;
    matches: (context: RefundContext) => Promise<boolean>;
}
