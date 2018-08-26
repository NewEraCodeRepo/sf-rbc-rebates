import { expect } from 'chai';
import { RebateProducer } from '../../app/kafka/producers/rebate_producer';
import buildRebate from '../fixtures/rebate';
import { TestLogger } from '../support/test_logger';

describe('Kafka Rebate Event Producer @kafka', () => {

  let logger;
  beforeEach(() => logger = new TestLogger());

  it('builds an event producer and dispatches a rebate message', async () => {

    // build event producer
    const rebateProducer = new RebateProducer(logger);
    const rebateModel = buildRebate();

    expect(rebateProducer.init).to.be.a.instanceOf(Function);

    await rebateProducer.init();

    await rebateProducer.dispatch(rebateModel);

    expect(logger.toString()).to.include('Event published');

  });

});
