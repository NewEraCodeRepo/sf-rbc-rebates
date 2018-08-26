import { Producer as KafkaProducer } from "node-rdkafka";
import { Config } from "./config";

export class Publisher {
  private producer: KafkaProducer;
  private startPromise?: Promise<void>;

  constructor(public readonly config = new Config()) {
    this.producer = new KafkaProducer(config.producer, {});
  }

  public async start() {
    if (!this.startPromise) {
      this.startPromise = new Promise((resolve, reject) => {
        this.producer.once('ready', () => {
          resolve();
        });

        this.producer.on('error', (error) => {
          reject(error);
        });

        this.producer.connect();
      });
    }

    return this.startPromise;
  }

  public async dispatch(options: {
    topic: string,
    key: string,
    message: Buffer | string | object,
    partition?: number
  }) {
    try {
      await this.start();

      const topicName = this.config.resolvedTopicName(options.topic);
      const message = this.parseMessage(options.message);

      this.producer.produce(
        topicName,
        options.partition || -1,
        message,
        options.key,
        null,
        {}
      );
    } catch (e) {
      throw new Error (e);
    }
  }

  public stop() {
    this.startPromise = undefined;
    this.producer.disconnect();
  }

  private parseMessage(message: any) {
    if (message instanceof Buffer) {
      return message;
    }

    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }

    return Buffer.from(message.toString());
  }
}
