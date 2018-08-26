import { expect } from 'chai';
import { JobRunner } from '../../app/scheduler/job_runner';
import { TestLogger } from '../support/test_logger';
import { Config } from '../../app/config';
import * as sinon from 'sinon';
import { RebateProducer } from '../../app/kafka/producers/rebate_producer';

describe('Scheduler', () => {

    let logger;
    let stub;
    let initStub;
    let dispatchStub;

    beforeEach(() => {
        logger = new TestLogger();
        stub = sinon.stub(process, 'exit');
        initStub = sinon.stub(RebateProducer.prototype, 'init');
        dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
    });

    afterEach(() => {
        stub.restore();
        initStub.restore();
        dispatchStub.restore();
    });

    it('runs transaction processing', async () => {

        const commandArgs = {
            type: 'TRANSACTION_PROCESSING'
        };

        const runner = new JobRunner(new Config({ logger }));

        await runner.start(commandArgs);

        expect(logger.toString()).to.include('Finished transaction processing');
    });

    it('runs transaction processing', async () => {

        const commandArgs = {
            type: 'MC_EXPORT'
        };

        const runner = new JobRunner(new Config({ logger }));

        await runner.start(commandArgs);

        expect(logger.toString()).to.include('Finished Rebate Extract');
    });

    it('runs transaction processing', async () => {

        const commandArgs = {
            type: 'MOP_SYNC'
        };

        const runner = new JobRunner(new Config({ logger }));

        await runner.start(commandArgs);

        expect(logger.toString()).to.include('Finished MOP sync');
    });

    it('runs all three', async () => {

        const commandArgs = {
            type: 'FULL_PROCESS'
        };

        const runner = new JobRunner(new Config({ logger }));

        await runner.start(commandArgs);

        expect(logger.toString()).to.include('Finished transaction processing');
        expect(logger.toString()).to.include('Finished Rebate Extract');
        expect(logger.toString()).to.include('Finished MOP sync');
    });

    it('gives direction if an invalid command is passed', async () => {

        const commandArgs = {
            type: 'fes'
        };

        const runner = new JobRunner(new Config({ logger }));

        await runner.start(commandArgs);

        expect(logger.toString()).to.include('Usage instructions:');
    });

});
