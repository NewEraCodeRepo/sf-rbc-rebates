import * as chai from 'chai';
const expect = chai.expect;
import transactionForRebateCriteria, { createTransactionForRebateCriteria } from '../fixtures/transaction_for_rebate_criteria';
import { TransactionForRebateCriteriaRepository } from '../../app/database/repositories/transaction_for_rebate_criteria_repository';
import { includeRepositoryTests } from "./shared_repository_tests";

describe('TransactionForRebateCriteriaRepository', () => {
  includeRepositoryTests(TransactionForRebateCriteriaRepository, transactionForRebateCriteria, true);

  it('can find the number of pending transactions', async () => {

    await createTransactionForRebateCriteria({
      processedAt: null
    });

    await createTransactionForRebateCriteria({
      processedAt: new Date()
    });

    const results = await TransactionForRebateCriteriaRepository.numPending();

    expect(results).to.equal(1);

  });

  it('assigns transactions to processes, with each user only having one processor', async () => {

    await createTransactionForRebateCriteria({
      processedAt: null,
      userId: "1"
    });

    await createTransactionForRebateCriteria({
      processedAt: null,
      userId: "1"
    });

    await createTransactionForRebateCriteria({
      processedAt: null,
      userId: "2"
    });

    await createTransactionForRebateCriteria({
      processedAt: null,
      userId: "4"
    });

    await createTransactionForRebateCriteria({
      processedAt: null,
      userId: "4"
    });

    await createTransactionForRebateCriteria({
      processedAt: null,
      userId: "4"
    });

    await TransactionForRebateCriteriaRepository.assignWorkerProcesses(5);

    const user1Transactions = await TransactionForRebateCriteriaRepository.findAll("user_id = '1'");
    expect(user1Transactions[0].processorId).to.equal(user1Transactions[1].processorId);

    const user4Transactions = await TransactionForRebateCriteriaRepository.findAll("user_id = '4'");
    expect(user4Transactions[0].processorId).to.equal(user4Transactions[1].processorId);
    expect(user4Transactions[0].processorId).to.equal(user4Transactions[2].processorId);

  });

  it('can get the transactions assigned to a process', async () => {

    await createTransactionForRebateCriteria({
      processedAt: null,
      processorId: 1
    });

    await createTransactionForRebateCriteria({
      processedAt: new Date(),
      processorId: 1
    });

    await createTransactionForRebateCriteria({
      processedAt: null,
      processorId: 2
    });

    const results = await TransactionForRebateCriteriaRepository.getTransactionsAssignedToProcess(1);

    expect(results.length).to.equal(1);
  });

});
