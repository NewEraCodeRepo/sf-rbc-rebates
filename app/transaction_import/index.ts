import { TransactionImportDetailsRepository } from "../database/repositories/transaction_import_details_repository";
import * as moment from "moment";
import { ILoggable } from "../interfaces/loggable";
import {ITransferDetails} from "../models/transfer_details";
import { IImportSource } from "../interfaces/import_source";
import { TransferStatus } from "../interfaces/transfer_status";

export class TransactionImport {

  public static async perform(source: IImportSource, ...args: any[]) {
    const transactionImport = new TransactionImport(source, ...args);
    await transactionImport.perform();
    return transactionImport;
  }

  private logger: ILoggable;
  private source: IImportSource;
  private transactionImportDetails: ITransferDetails;

  constructor(source: IImportSource, options: any = { logger: console }) {
    this.logger = options.logger;
    this.source = source;
  }

  public async perform() {
    this.logger.info("Recording Transaction start...");
    await this.start();

    try {
      this.logger.info("Importing Transactions...");
      await this.source.perform();

      this.logger.info("Recording Transaction end...");
      await this.succeed();
    } catch (error) {
      await this.failed(error);
      throw error;
    }
  }

  private now() {
    return new Date();
  }

  private async start() {
    this.transactionImportDetails = await TransactionImportDetailsRepository.insert({
      startedAt: this.now(),
      status: TransferStatus.InProgress
    });
  }

  private async succeed() {
    await this.finish(TransferStatus.Complete);
  }

  private async failed(error) {
    this.logger.error("Transaction sync failed:", error);
    await this.finish(TransferStatus.Failed);
  }

  private async finish(status: TransferStatus) {
    const now = this.now();

    const durationInMs = moment(now).diff(this.transactionImportDetails.startedAt);
    this.logger.info(`Import finished in ${durationInMs}ms`);

    const id = this.transactionImportDetails.id;

    return await TransactionImportDetailsRepository.update(id, {
      finishedAt: now,
      numberOfItems: this.source.transactions.length,
      status
    });
  }

}
