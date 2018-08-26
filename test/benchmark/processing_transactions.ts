import * as util from 'util';
import * as faker from 'faker';
import * as env from 'env-var';
import buildTransactionForRebateCriteria from '../fixtures/transaction_for_rebate_criteria';
import { setupCleanDatabase } from '../support/database';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { RebateRepository } from '../../app/database/repositories/rebate_repository';
import { NestedLogger } from "./nested_logger";
import { TransactionForRebateCriteriaRepository } from '../../app/database/repositories/transaction_for_rebate_criteria_repository';
import { TransactionForRebateCriteriaSerializer } from '../../app/database/serializers/transaction_for_rebate_criteria_serializer';
import { UserSerializer } from '../../app/database/serializers/user_serializer';
import { UserRepository } from '../../app/database/repositories/user_repository';
import buildUser from '../fixtures/user';

const log = new NestedLogger(console);

async function upto(n, callback: (i: number) => Promise<void>) {
  for (let i = 0; i < n; i ++) {
    await callback(i + 1);
  }
}

async function insertUpTo(numberToCreate, batchSize, buildFn: (obj: any) => any, serializeFn: (obj: any) => any, bulkInsertFn: ([]: Iterable<any>) => Promise<any> ) {

  const transactionQuotient = Math.floor(numberToCreate / batchSize); // num of 10k batches to insert - 1
  const transactionRemainder = numberToCreate % batchSize; // remainder to do on the last insert

  for (let i = 0; i <= transactionQuotient; i++) {
    const numToCreate = ( i === transactionQuotient ) ? transactionRemainder : batchSize;

    const entitiesToCreate: any[] = [];

    for (let j = 0; j < numToCreate; j++) {
      const entity = buildFn( i * batchSize + j );
      entitiesToCreate.push(serializeFn(entity));
    }

    try {
      await bulkInsertFn(entitiesToCreate);
    } catch (error) {
      log.info("Caught bulk insert error: ", error);
    }
  }
  log.info("Inserted records...");

  return true;
}

async function prepareScenario(options: {
  numUsers: number,
  numRebateCriteria: number,
  numTransactions: number
}) {

  await setupCleanDatabase();
  log.info('Cleaned database');

  await upto(options.numRebateCriteria, async (i) => {
    await createRebateCriteria({
      id: i.toString(),
      hasBeenActivated: true,
      isRedeemable: true,
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });
  });

  log.debug(`Prepared ${readableNumber(options.numRebateCriteria)} rebate criteria`);

  await insertUpTo(options.numUsers, 2000,
    (id) => buildUser({ id }),
    UserSerializer.serialize,
    UserRepository.bulkInsertRaw.bind(UserRepository)
  );

  log.info(`Prepared ${readableNumber(options.numUsers)} users`);

  await insertUpTo(options.numTransactions, 2000,
    (id) => { return buildTransactionForRebateCriteria({
        processedAt: null,
        userId: faker.random.number(options.numUsers).toString(),
        rebateCriteriaId: faker.random.number(options.numRebateCriteria).toString()
      });
    },
    TransactionForRebateCriteriaSerializer.serialize,
    TransactionForRebateCriteriaRepository.bulkInsertRaw.bind(TransactionForRebateCriteriaRepository)
  );

  log.info(`Prepared ${readableNumber(options.numTransactions)} transactions`);
  log.info(`Preparation Complete`);
}

function readableNumber(n) {
  return Number(n).toLocaleString();
}

async function benchmark(description, options: any) {
  log.descend();
  log.info(description);
  log.descend();

  Object.keys(options).forEach((property) => {
    log.debug(`${property}: ${util.format(options[property])}`);
  });

  await reportTime("Set-up", async () => {
    await prepareScenario(options);
  });

  // await reportTime("Benchmark", async () => {
  //   await TransactionProcessing.perform({ async: options.async, logger });
  // });

  log.debug(`Rebates issued: ${await RebateRepository.count()}`);

  log.ascend();
  log.ascend();
  log.info();
}

async function runSuite() {
  log.info("Processing transactions");
  log.descend();

  const numTransactions = env.get("NUM_PERF_TRANSACTIONS", "1000000").asInt() || 10000;
  const numRebateCriteria = env.get("NUM_PERF_OFFERS", "200").asInt() || 200;
  const numUsers = env.get("NUM_PERF_USERS", "15000000").asInt() || 10000;

  const settings = {
    numTransactions,
    numRebateCriteria,
    numUsers
  };

  await benchmark(`${readableNumber(numTransactions)} sequentially`, {
    async: false,
    ...settings
  });
}

async function reportTime(title: string, callback: () => Promise<void>) {
  log.debug(`${title} starting...`);
  log.descend();

  const startTime = new Date();
  await callback();
  const endTime = new Date();

  const durationInSecs = (endTime.getTime() - startTime.getTime()) / 1000;

  log.ascend();
  log.info(`${title} took ${readableNumber(durationInSecs)}s`);
}

runSuite();
