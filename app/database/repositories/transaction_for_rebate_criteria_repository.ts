import { TransactionForRebateCriteriaRecord } from "../records/transaction_for_rebate_criteria_record";
import { TransactionForRebateCriteriaSerializer } from "../serializers/transaction_for_rebate_criteria_serializer";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { Repository } from "./repository";

class RepositoryForTransactionForRebateCriteria extends Repository<ITransactionForRebateCriteria> {
  constructor(
    record = TransactionForRebateCriteriaRecord,
    serializer = TransactionForRebateCriteriaSerializer
  ) {
    super(record, serializer);
  }

  public async findAllPending() {
    return this.findAll("processed_at IS NULL");
  }

  public async numPending(): Promise<number> {
    const result = await this
          .connection
          .query(`
            SELECT COUNT(id)
            FROM transaction_for_rebate_criteria
            WHERE processed_at IS NULL
          `);

    if (result && result.length === 1 && result[0].count) {
      return parseInt(result[0].count, 10);
    }

    throw new Error(`Invalid response from count call: ${JSON.stringify(result)}`);
  }

  // Assign out a worker to each transaction based on a hash of the user_id of the transaction
  // so that the transactions for each user are guaranteed to be handled sequentially
  public async assignWorkerProcesses(totalWorkers: number) {
    return await this
          .connection
          .query(`
          UPDATE transaction_for_rebate_criteria AS trans
          SET processor_id = ( CASE WHEN idToInt.process_id < 0 THEN -idToInt.process_id + 1 ELSE idToInt.process_id + 1 END )
          FROM
            ( SELECT
                DISTINCT (user_id) as user_id,
                ('x' || lpad(md5(user_id), 8, '0'))::bit(32)::int % ${totalWorkers} as process_id
              FROM transaction_for_rebate_criteria
            ) AS idToInt
          WHERE
            trans.user_id = idToInt.user_id
            AND trans.processed_at is null;
          `);
  }

  // get all the transactions that haven't been processed and are assigned to a given processor to work on
  public async getTransactionsAssignedToProcess(processNum: number) {
    return this.findAll(`
        processed_at IS NULL
        AND processor_id = ${processNum}
        ORDER BY transaction_date
      `);
  }

  public async getTransactionsNotAssigned() {
    const result = await this
          .connection
          .query(`
            SELECT COUNT(id)
            FROM transaction_for_rebate_criteria
            WHERE processed_at IS NULL AND processor_id IS NULL
          `);

    if (result && result.length === 1 && result[0].count) {
      return parseInt(result[0].count, 10);
    }

    throw new Error(`Invalid response from count call: ${JSON.stringify(result)}`);
  }

}

export const TransactionForRebateCriteriaRepository = new RepositoryForTransactionForRebateCriteria();
