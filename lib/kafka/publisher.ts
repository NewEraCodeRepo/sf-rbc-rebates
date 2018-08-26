import { IRecord, IPublisher } from "datapipeline-lib";
import * as Kafka from "node-rdkafka";
import { ILoggable } from "../../app/interfaces/loggable";

export class Publisher implements IPublisher {

  constructor(private producer: Kafka.Producer) {}

  public isConnected(): boolean {
    return this.producer.isConnected();
  }

  public disconnect(): Promise<void|Error> {
    return new Promise((resolve, reject) => {
      this.producer.flush(2000, (err: Error) => {
        const logger: ILoggable = console;
        if (err) {
          logger.error("Flush error", err);
          reject(err);
        } else {
          this.producer.disconnect((e: Error) => {
            if (e) {
              logger.error("Disconnect error", e);
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  public publish(topic: string, rec: IRecord): Error|null {
    return this.producer.produce(
      topic, -1, rec.value, rec.key, Date.now(), {},
    ) ? null : this.producer.getLastError();
  }
}
