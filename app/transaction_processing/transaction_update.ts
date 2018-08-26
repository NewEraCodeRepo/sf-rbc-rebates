import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TransactionForRebateCriteriaRepository } from "../database/repositories/transaction_for_rebate_criteria_repository";

export class TransactionUpdate {
    constructor(
        public transaction: ITransactionForRebateCriteria,
        public result: TransactionStatus
    ) {}

    public async perform() {
        await TransactionForRebateCriteriaRepository.update(this.transaction.id, {
            processedAt: new Date(),
            status: this.result
        });
    }
}
