import { IImportSource } from "../interfaces/import_source";
import {TransactionForRebateCriteriaRepository} from "../database/repositories/transaction_for_rebate_criteria_repository";
import {TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import {TransactionImportSerializer} from "../database/serializers/transaction_import_serializer";
import * as Papa from 'papaparse';
import { ILoggable } from "../interfaces/loggable";

export class CSVImportString implements IImportSource {
  public transactions: ITransactionForRebateCriteria[] = [];
  private logger: ILoggable;

  constructor(private readonly csvString, options: any = { logger: console }) {
    this.logger = options.logger;
  }

  public async perform() {
    this.parseCSV(this.csvString);
    await this.importEntries();
  }

  private parseCSV(csv) {
    const { data } = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      error: (error, file) => {
        this.logger.error("CSV Parsing Error: " + JSON.stringify(error, null, "\t"));
        throw error;
      }
    });

    data.forEach((entry) => {
      const parsedEntry: any = this.parseEntry(entry);
      this.transactions.push(parsedEntry);
    });
  }

  private async importEntries() {
    try {
      await TransactionForRebateCriteriaRepository.bulkInsert(this.transactions);
    } catch (error) {

      this.logger.error("TransactionForRebateCriteria Database Error: " + JSON.stringify(error, null, "\t"));
      throw error;
    }
  }

  // Can't map to ITransactionForRebateCriteria interface because
  // ITransactionForRebateCriteria.id is a serial pkey.
  private parseEntry(data: any): Partial<ITransactionForRebateCriteria> {
    const serializedData = TransactionImportSerializer.serialize(data);

    return {
      transactionId: serializedData.transaction_id,
      accountId: serializedData.account_id,
      userId: serializedData.user_id,
      rebateCriteriaId: serializedData.rebate_criteria_id,
      rebateId: serializedData.rebate_id,
      amount: serializedData.amount,
      processedAt: null,
      transactionType: serializedData.transaction_type,
      status: TransactionStatus.Pending,
      card: serializedData.card,
      basePoints: Number(serializedData.base_points),
      cardType: serializedData.card_type,
      transactionDate: new Date(serializedData.transaction_date),
      transactionCurrency: serializedData.transaction_currency,
      transactionPostalCode: serializedData.transaction_postal_code,
      productCodeExternal: serializedData.product_code_external,
      isManual: Boolean(serializedData.is_manual)
    };

  }
}
