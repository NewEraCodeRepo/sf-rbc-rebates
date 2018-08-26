import { expect } from 'chai';
import { buildRebateEventFn } from '../../app/kafka/events/event_builder';
import buildRebate from '../fixtures/rebate';
import { RebateSetEvent } from 'datapipeline-schemas/events/rebateSetEvent';
import { IRebatePayload, TransactionStatus } from 'datapipeline-schemas/rebateManagementObject';

describe('Kafka Event Builder', () => {

  it('builds a rebate event from a rebate object', async () => {

    const rebateForTesting = buildRebate();

    const fulfilledDate: Date | null = rebateForTesting.fulfilledDate;
    const fulfilledTransactionId: string | null = rebateForTesting.fulfilledTransactionId;

    const payload: IRebatePayload = {
        id: rebateForTesting.id,
        userId: rebateForTesting.userId,
        accountId: rebateForTesting.accountId,
        offerId: rebateForTesting.rebateCriteriaId,
        amount: rebateForTesting.amount,
        rewardType: rebateForTesting.rewardType,
        fulfilledAt: fulfilledDate,
        issuedAt: rebateForTesting.issuedAt,
        qualifiedTransactionId: rebateForTesting.accountTransactionId,
        fulfilledTransactionId,
        status: rebateForTesting.status as TransactionStatus,
        qualifyingTransaction: rebateForTesting.qualifyingTransaction,
        fulfillmentTransaction: rebateForTesting.fulfillmentTransaction
    };

    const rebateSetEvent: RebateSetEvent = buildRebateEventFn()(rebateForTesting);

    expect(rebateSetEvent).to.not.be.null;
    expect(rebateSetEvent.rebate).to.deep.equal(payload);
  });

});
