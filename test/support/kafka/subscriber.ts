import { KafkaConsumer } from "node-rdkafka";
import { Config } from "./config";

export class Subscriber {
  public lastEvent: Promise<any>;
  private consumer: KafkaConsumer;
  private startPromise?: Promise<void>;

  constructor(public readonly config = new Config()) {
    this.consumer = new KafkaConsumer(config.consumer, {}); // TODO - add similar configuration to datapipeline-lib
  }

  public async start() {
    if (!this.startPromise) {
      this.startPromise = new Promise((resolve) => {
        this.consumer.once('ready', () => {
          this.consumer.subscribe(this.topicNames);
          this.consumer.consume();
          resolve();
        });

        this.lastEvent = new Promise((resolveLastEvent) => {
          this.consumer.on('data', (message) => {
            const data = JSON.parse(message.value.toString());

            resolveLastEvent({
              topic: message.topic,
              payload: data
            });
          });
        });

        this.consumer.on('error', (error) => {
          throw error;
        });

        this.consumer.connect();
      });
    }

    return this.startPromise;
  }

  public stop() {
    this.startPromise = undefined;
    this.consumer.disconnect();
  }

  private get topicNames() {
    return this.config.resolvedTopicNames;
  }
}
