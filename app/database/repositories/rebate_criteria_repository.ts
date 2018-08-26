import { RebateCriteriaRecord } from "../records/rebate_criteria_record";
import { RebateCriteriaSerializer } from "../serializers/rebate_criteria_serializer";
import { IRebateCriteria } from "../../models/rebate_criteria";
import { Repository } from "./repository";

class RepositoryForRebateCriteria extends Repository<IRebateCriteria> {
  constructor(
    record = RebateCriteriaRecord,
    serializer = RebateCriteriaSerializer
  ) {
    super(record, serializer);
  }

  // Returns all records marked for testing purposes
  public async findAllForTesting() {
    return this.findAll();
  }
}

export const RebateCriteriaRepository = new RepositoryForRebateCriteria();
