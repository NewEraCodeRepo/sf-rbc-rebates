import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { IRebate } from "../../models/rebate";
import { RebateRepository } from "../../database/repositories/rebate_repository";
import {IRebateCriteria} from "../../models/rebate_criteria";
import {RebateCriteriaRepository} from "../../database/repositories/rebate_criteria_repository";

export class FulfillmentContext {
    private rebate: IRebate;
    private rebateCriteria: IRebateCriteria;

    constructor(
        public readonly transaction: ITransactionForRebateCriteria,
    ) {}

    public async getRebate() {
        this.rebate = this.rebate || await this.findRebate();
        return this.rebate;
    }

    public async getRebateCriteria() {
        this.rebateCriteria = this.rebateCriteria || await this.findRebateCriteria();
        return this.rebateCriteria;
    }

    private async findRebate() {
        return await RebateRepository.find(this.transaction.rebateId as string) as IRebate;
    }

    private async findRebateCriteria() {
        return await RebateCriteriaRepository.find(this.transaction.rebateCriteriaId as string) as IRebateCriteria;
    }
}
