import * as commandLineArgs from "command-line-args";
import { JobRunner } from "./job_runner";
import environment from "../../config/environment";
import { throng } from "./throng_fork";
import * as cluster from "cluster";

const workers = environment.transactionProcessing.concurrency;
const optionDefinitions = [
    { name: 'type', type: String, alias: 't' }
];

// Worker process that will just run the TRANSACTION_PROCESSING command
async function workerProcess(id) {
    process.on('message', async (msg) => {
        if(msg == "START_WORKERS"){
            await new JobRunner().start({ type: 'WORKER', id, workers });;
        }
      });
}

// Master process that will orchestrate the workers, waiting for them to
// finish processing all "pending" transactions before moving on to export, etc
async function masterProcess(workerProcesses) {
    return await new JobRunner().start({ type: 'MASTER', workers, workerProcesses });
}

(async () => {
    // If args are passed in use the passed in command
    if (process.argv.length >= 3 ) {
        new JobRunner().start(commandLineArgs(optionDefinitions));
    } else {
        // else...start 1 "master" and WEB_CONCURRENCY # of worker processes
        throng({
            workers,
            grace: 1000,
            master: masterProcess,
            start: workerProcess
        })
    }
})();
