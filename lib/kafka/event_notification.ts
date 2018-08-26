import {IPublishResult, IRecord} from "datapipeline-lib";
import { Producer } from "../../lib/kafka/producer";
import { ILoggable } from "../../app/interfaces/loggable";

export class EventNotification {

  public static async dispatch(topic: string, message: IRecord) {
    try {
      const producer = new Producer();
      this.publisher = await producer.initPublisher();
      return this.createResult(this.publisher.publish(topic, message));
    } catch (e) {
      this.logger.error(`Error with publisher event dispatcher: ${JSON.stringify(e, null, "\t")}`);
    }

  }

  public static async disconnect() {
    try {
      if (this.publisher) {
        await this.publisher.disconnect();
      }
    } catch (e) {
      this.logger.error(`Error disconnecting publisher: ${JSON.stringify(e, null, "\t")}`);
    }
  }

  private static publisher: any;

  private static logger: ILoggable = console;

  private static createResult(err: Error|null): IPublishResult {
    if (err !== null) {
      this.logger.error(`Error creating event result: ${JSON.stringify(err, null, "\t")}`);
      return {successful: false, error: err};
    } else {
      return {successful: true};
    }
  }

}
