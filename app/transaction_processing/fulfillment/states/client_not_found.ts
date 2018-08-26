import { FulfillmentState } from "../state";
import { FulfillmentContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { UserRepository } from "../../../database/repositories/user_repository";

export const ClientNotFound: FulfillmentState = {
    status: TransactionStatus.CannotFindClient,

    async matches(context: FulfillmentContext) {
        const user = await UserRepository.find(context.transaction.userId);

        return !user;
    }
};
