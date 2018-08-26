/* tslint:disable:no-console */

import { Publisher } from "../support/kafka/publisher";
import { Subscriber } from "../support/kafka/subscriber";

async function time(section, callback: () => Promise<any>) {
  console.time(section);
  await callback();
  console.timeEnd(section);
}

async function run() {
  console.log('Kafka Timings');

  const publisher = new Publisher();
  const subscriber = new Subscriber();

  let receivedEvent;
  let receivedAt: Date;

  await Promise.all([
    time('Starting subscriber', () => subscriber.start()),
    time('Starting publisher', () => publisher.start())
  ]);

  time('Dispatching message', async () => {
    await publisher.dispatch({
      topic: 'debug',
      key: 'ping',
      message: {
        issuedAt: new Date().toISOString()
      }
    });
  });

  await time('Reading message', async () => {
    receivedEvent = await subscriber.lastEvent;
    receivedAt = new Date();
  });

  const receivedTimestamp = Date.parse(receivedEvent.payload.issuedAt);
  const differenceInMs = receivedAt!.getTime() - receivedTimestamp;

  console.log(`Difference: ${differenceInMs}ms`);

  subscriber.stop();
  publisher.stop();
}

run();
