import rebate from '../fixtures/rebate';
import { RebateRepository } from '../../app/database/repositories/rebate_repository';
import { createRebate } from "../fixtures/rebate";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import * as chai from 'chai';
import { dateAppropriateForTesting } from '../support/fixtures';
const expect = chai.expect;

describe('RebateRepository', () => {

  it('can calculate count of all rebates', async () => {
     // create fulfilled rebate
    const fulfilledRebate = rebate ({
      status: TransactionStatus.FulfilledTransSuccessful,
      fulfilledAmount: "10.00",
      lastMopSync: null
    });

    await RebateRepository.bulkInsert([
      rebate({
        status: TransactionStatus.FulfilledTransSuccessful,
        fulfilledAmount: "10.00",
        rebateCriteriaId: fulfilledRebate.rebateCriteriaId,
        lastMopSync: null
      }),
      // this one shouldn't sync because of the lastMopSync field being set
      rebate({
        status: TransactionStatus.FulfilledTransSuccessful,
        fulfilledAmount: "10.00",
        rebateCriteriaId: fulfilledRebate.rebateCriteriaId,
        lastMopSync: dateAppropriateForTesting()
      }),
      fulfilledRebate
    ]);

    const secondCount = await RebateRepository.totalRedeemedCountForUpdate(fulfilledRebate.rebateCriteriaId);
    expect(secondCount).to.eq(2);

  });

  it('can calculate sum of all rebates', async () => {
    // create fulfilled rebate
    const fulfilledRebate = await createRebate ( {
      status: TransactionStatus.FulfilledTransSuccessful,
      fulfilledAmount: "10.00",
      lastMopSync: null
    });

    await createRebate ( {
      status: TransactionStatus.FulfilledTransSuccessful,
      fulfilledAmount: "0.01",
      rebateCriteriaId: fulfilledRebate.rebateCriteriaId,
      lastMopSync: null
    });

    const sum = await RebateRepository.totalRedeemedSumForUpdate(fulfilledRebate.rebateCriteriaId);
    expect(sum).to.eq("10.01");

  });

  it('issues rebates with an id above 10 million', async () => {
    // create fulfilled rebate
    const createdRebate = await createRebate ( {
      status: TransactionStatus.FulfilledTransSuccessful
    });

    expect(parseInt(createdRebate.id, 10)).to.be.gte(10000000);
 });

});
