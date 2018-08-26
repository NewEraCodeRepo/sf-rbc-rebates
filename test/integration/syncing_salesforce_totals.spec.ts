import { expect } from 'chai';
import 'mocha';
import { RewardType } from 'datapipeline-schemas/rebateManagementObject';
import { TransactionStatus } from 'datapipeline-schemas/rebateManagementObject';
import { createRebateCriteria } from '../fixtures/rebate_criteria';
import { createRebate } from '../fixtures/rebate';
import { createOffer } from '../fixtures/offer';
import { requiresDatabase } from '../support/database';
import { OfferRepository } from '../../app/database/repositories/offer_repository';
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { RebateRepository } from '../../app/database/repositories/rebate_repository';

describe("Syncing totals with Salesforce", () => {
  requiresDatabase();

  let offerCreated;
  let rebateCriteria;
  beforeEach( async () => {
    // create an offer in the SF DB that matches the rebate criteria
    offerCreated = await createOffer({});

    // Create a rebate criteria with $2 off
    rebateCriteria = await createRebateCriteria({
      id: offerCreated.offerId,
      descriptionForTesting: '$2 off',
      rewardCalculation: {
        operand: '-2',
        operation: ArithmeticOperation.Addition,
        unit: RewardType.Dollars
      },
      requiresCustomerToBeLinked: false,
      requiresCustomerToBeTargeted: false
    });

    // Log a successful rebate transaction
    await createRebate({
      amount: '2',
      fulfilledAmount: '2',
      accountId: 'ACCOUNT-1',
      rebateCriteriaId: rebateCriteria.id,
      status: TransactionStatus.FulfilledTransSuccessful
    });

    // Log a pending rebate transaction
    await createRebate({
      amount: '2',
      fulfilledAmount: '2',
      accountId: 'ACCOUNT-1',
      rebateCriteriaId: rebateCriteria.id,
      status: TransactionStatus.PendingFulfillment
    });

    // Log an errored rebate transaction
    await createRebate({
      amount: '2',
      fulfilledAmount: '2',
      accountId: 'ACCOUNT-1',
      rebateCriteriaId: rebateCriteria.id,
      status: TransactionStatus.RebateNotPending
    });

  });

  it("can sync running totals", async () => {

    // sync totals to MOP
    await OfferRepository.syncTotalsToMOP();

    // Assert that the running rebate totals are updated and the rebate was updated
    const lastOffer = await OfferRepository.last();
    const updatedRebate = await RebateRepository.last();

    expect(lastOffer.offerId).to.eq(offerCreated.offerId);
    expect(lastOffer.runningRedemptionCount).to.eq(1);
    expect(lastOffer.runningRedemptionAmount).to.eq(2);

    expect(updatedRebate.lastMopSync).to.not.be.null;

  });

  it("doesn't count previous rebates after syncing multiple times", async () => {

    // sync totals to MOP multiple times
    await OfferRepository.syncTotalsToMOP();
    await OfferRepository.syncTotalsToMOP();

    // Assert that the running rebate totals are updated
    const lastOffer = await OfferRepository.last();
    const updatedRebate = await RebateRepository.last();

    expect(lastOffer.runningRedemptionCount).to.eq(1);
    expect(lastOffer.runningRedemptionAmount).to.eq(2);

    expect(updatedRebate.lastMopSync).to.not.be.null;
  });

});
