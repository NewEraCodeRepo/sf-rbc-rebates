import { RefundState } from "../state";
import { RefundContext } from "../context";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { RebateRepository } from "../../../../app/database/repositories/rebate_repository";
import { Validator } from "class-validator";
const validator = new Validator();

export const RebateNotFound: RefundState = {
    status: TransactionStatus.RebateNotFound,

    async matches(context: RefundContext) {
        const rebates = await RebateRepository.findQualifyingTransactions(context.transaction);

        return !validator.arrayNotEmpty(rebates);
    }
};
