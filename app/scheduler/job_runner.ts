import boot from "../../config/boot";
import * as cluster from "cluster";
import { Config } from "../config";
import { TransactionProcessing } from "../transaction_processing";
import { RebateExport } from "../exports/rebates/rebate_export";
import { OfferRepository } from "../database/repositories/offer_repository";
import { TransactionForRebateCriteriaRepository } from "../database/repositories/transaction_for_rebate_criteria_repository";
import { ChildProcess } from "child_process";

export class JobRunner {

    constructor(public readonly config: Config = new Config()) {}

    get logger() {
        return this.config.logger;
    }

    public async build() {
        await boot();
    }

    public async start(commandArgs: any) {
        await this.build();

        if (!commandArgs.type || commandArgs.type === null) {
            // do we need to disconnect from the database?
            this.printUsageInstructions();
            process.exit(1);
            return;
        }

        switch (commandArgs.type.toUpperCase()) {
            case 'MASTER': {
                await this.masterProcess(commandArgs.workers, commandArgs.workerProcesses);
                break;
            }

            case 'WORKER': {
                // wait for the master to finish their setup before starting workers
                await this.workerProcess(commandArgs.id);
                break;
            }
            
            case 'TRANSACTION_PROCESSING':
            case 'T_P': {
                await this.doTransactionProcessing();
                break;
            }

            case 'MC_EXPORT':
            case 'MC_E': {
                await this.doMCExport();
                break;
            }

            case 'MOP_SYNC': {
                await this.doMOPSync();
                break;
            }

            case 'FULL_PROCESS': {
                await this.doTransactionProcessing()
                    .then(this.doMCExport.bind(this))
                    .then(this.doMOPSync.bind(this));
                break;
            }

            default: {
                this.printUsageInstructions();
            }
        }

        process.exit(0);
    }

    // Harness for full master/worker processing
    private async masterProcess(numWorkers: number, workerProcesses: ChildProcess[]) {
        this.logger.info('Master Process started\n');

        this.logger.info('Assigning processors....');
        await TransactionForRebateCriteriaRepository.assignWorkerProcesses(numWorkers);
        this.logger.info('Processors assigned\n');

        if (cluster.isMaster) {
            workerProcesses.forEach( (worker) => {
                worker.send("START_WORKERS");
            });
        }
        this.logger.info('Waiting on workers...');

        let numLeft: number = 1;

        // wait for the workers to get done processing
        while (numLeft !== 0) {
            await this.wait(5000);
            numLeft = await TransactionForRebateCriteriaRepository.numPending();
            //TODO: monitor workers for failure, restarting if one of them isn't processing any records anymore
            this.logger.info(`${JSON.stringify(numLeft)} records still to process...`)
        }

        this.logger.info('Workers done processing, continuing');
        
        await this.doMCExport();
        
        await this.doMOPSync();

        return true;
    }

    // Simple worker process that runs through and does transaction processing
    private async workerProcess(workerNum: number) {
        this.logger.info(`W${workerNum}: Worker starting`);
        await this.doTransactionProcessing(workerNum);
        this.logger.info(`W${workerNum}: Worker finished`);
    }

    // helper function to pause workers and/or master to wait for the others
    private async wait(ms){
        return new Promise((r, j) => { setTimeout(r, ms)});
    }

    // Provide a friendly message on usage if incorrect
    private printUsageInstructions() {
        this.logger.warn('Command doesn\'t match known process.\nUsage instructions:');
        this.logger.warn('Full master/worker:             node build/app/scheduler/boot');
        this.logger.warn('Run Transaction Processing:     node build/app/scheduler/boot --type TRANSACTION_PROCESSING');
        this.logger.warn('                                node build/app/scheduler/boot -t T_P');
        this.logger.warn('Run MC Export:                  node build/app/scheduler/boot --type MC_EXPORT');
        this.logger.warn('                                node build/app/scheduler/boot -t MC_E');
        this.logger.warn('Sync Rebates to MOP:            node build/app/scheduler/boot --type MOP_SYNC');
        this.logger.warn('Run all three:                  node build/app/scheduler/boot --type FULL_PROCESS');
    }

    // Process all the qualifying, refund, and rebate transactions, marking the appropriate status
    private async doTransactionProcessing(workerNumber?: number) {
        try {
            this.logger.info('Beginning Transaction processing...');
            await TransactionProcessing.perform({ logger: this.logger, workerNumber });
            this.logger.info('Finished transaction processing');
            return;
        } catch (e) {
            this.logger.error('ERROR in transaction processing.', e);
            process.exit(1);
        }
    }

    // Export any un-exported rebates to Marketing Cloud
    private async doMCExport() {
        try {
            this.logger.info('Beginning Rebate Extract...');
            await RebateExport.perform({ logger: this.logger });
            this.logger.info('Finished Rebate Extract');
        } catch (e) {
            this.logger.error('ERROR in Rebate extract.', e);
            process.exit(1);
        }
    }

    // Sync the running totals to MOP
    private async doMOPSync() {
        try {
            this.logger.info('Beginning MOP sync...');
            await OfferRepository.syncTotalsToMOP();
            this.logger.info('Finished MOP sync');
        } catch (e) {
            this.logger.error('ERROR in MOP sync.', e);
            process.exit(1);
        }
    }

}
