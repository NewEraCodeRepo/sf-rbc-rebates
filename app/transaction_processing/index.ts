import { TransactionForRebateCriteriaRepository } from "../database/repositories/transaction_for_rebate_criteria_repository";
import { ILoggable } from "../interfaces/loggable";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import { QualifyingStrategy } from "./qualifying_strategy";
import { RefundStrategy } from "./refund_strategy";
import { TaggedLogger } from "../tagged_logger";
import { FulfillmentStrategy } from "./fulfillment_strategy";
import environment from "../../config/environment";
import { RebateProducer } from "../kafka/producers/rebate_producer";
import { Producer } from "../kafka/producers/producer";

export class TransactionProcessing {
  // Scans for unprocessed transactions and processes them, according to their
  // type. For example, a "qualifying" transaction may be processed by
  // issuing a rebate, at which point the transaction will be marked as
  // processed.
  public static async perform(...args: any[]) {
    const rebateProducer: RebateProducer = new RebateProducer();
    await rebateProducer.init();

    const processing = new TransactionProcessing(rebateProducer, ...args);
    return await processing.perform();
  }

  private ASYNC_BY_DEFAULT = environment.transactionProcessing.async;
  private STRATEGIES = [QualifyingStrategy, FulfillmentStrategy, RefundStrategy];
  private logger: ILoggable;
  private async: boolean;
  private messageProducer: Producer;
  private workerNumber?: number;

  constructor(
    messageProducer: Producer,
    options: { logger?: ILoggable, async?: boolean, workerNumber?: number } = {}
  ) {
    this.logger = options.logger || console;
    this.async = options.async === undefined ? this.ASYNC_BY_DEFAULT : options.async;
    this.messageProducer = messageProducer;
    this.workerNumber = options.workerNumber;
  }

  public async perform() {
    // initial load testing show that in parallel quick runs into an out-of-memory exception
    // leaving for future developers in case this gets solved/upped
    this.logger.info(
      'Processing transactions',
      this.async ? 'in parallel' : 'sequentially'
    );

    let pending: ITransactionForRebateCriteria[];

    if (this.workerNumber) {
      pending = await TransactionForRebateCriteriaRepository.getTransactionsAssignedToProcess(this.workerNumber);
      this.logger.info(`Worker ${this.workerNumber} Transactions to process: ${pending.length}`);
    } else {
      pending = await this.pendingTransactions();
      this.logger.info(`Transactions to process: ${pending.length}`);
    }

    if (this.async) {
      const processJobs = pending.map(this.processTransaction.bind(this));
      await Promise.all(processJobs);
    } else {
      for (const transaction of pending) {
        await this.processTransaction(transaction);
      }
    }

    this.logger.info("Processing complete");
  }

  // gets ALL pending transactions, for when there are a small number of transactions (such as QA testing)
  private async pendingTransactions() {
    return await TransactionForRebateCriteriaRepository.findAllPending() as ITransactionForRebateCriteria[];
  }

  private async processTransaction(transaction: ITransactionForRebateCriteria) {
    const tag = this.workerNumber ? ` W${this.workerNumber}: ${transaction.transactionId}` : transaction.transactionId;
    const taggedLogger = new TaggedLogger(this.logger, tag);
    taggedLogger.info(`Processing ${transaction.transactionType} transaction`);

    try {
      const strategy: any = await this.findStrategyFor(transaction);
      await strategy.perform(transaction, this.messageProducer, taggedLogger);
    } catch (e) {
      taggedLogger.error('Processing error:', e);
    }
  }

  private async findStrategyFor(transaction) {
    const transactionStrategy = this.STRATEGIES.find((strategy) => strategy.matches(transaction));

    if (!transactionStrategy) {
      throw new Error(`Can't find strategy for ${JSON.stringify(transaction)}`);
    }

    return transactionStrategy;
  }
}
