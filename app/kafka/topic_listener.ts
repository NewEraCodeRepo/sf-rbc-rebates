/* tslint:disable-next-line
require('newrelic'); */
import { ILoggable } from "../../app/interfaces/loggable";
import {Consumer} from "./consumers/consumer";
import boot from "../../config/boot";
import * as env from "env-var";
// import {KafkaConfig} from "./config";
import * as throng from "throng";

const logger: ILoggable = console;
const topics = process.argv.slice(2);
// const topics = KafkaConfig.getTopicsToStream();
const LISTENER_CONCURRENCY: any = env.get("LISTENER_CONCURRENCY", "1").asInt();

// Kafka Workaround - On uncaught exception, force-crash the process, leading to a restart
process.on("uncaughtException", (err) => {
    logger.error("Catching uncaught exception:");
    logger.error(err);
    process.exit(1);
});

process.on("exit", () => {
    logger.info("Exit not exiting, send a SIGTERM.");
    process.kill( process.pid, 'SIGTERM' );
});

async function start() {
    await boot();

    const consumers: Consumer[] = [];

    topics.forEach(async (topic) => {
        logger.info(`[Status] starting ${topic} stream...`);

        const consumer = new Consumer(topic);
        await consumer.start();
        consumers.push(consumer);

        logger.info(`[Status] ${topic} stream started...`);
    });

    process.on("SIGTERM",  async () => {
        logger.info("Got SIGTERM. Graceful shutdown start", new Date().toISOString());

        for (const consumer of consumers) {
            await consumer.stop();
        }
        process.exit(1);
    });
}

(async () => {
    throng(
      LISTENER_CONCURRENCY,
    async () => {
        start()
        .catch((err: Error) => {
            logger.error(err);
            process.exit(1);
        });
    });
})();
