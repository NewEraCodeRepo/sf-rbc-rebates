import { defaultProducerConfigBuilder,
  IProducerConfiguration, IPublisher,
} from "datapipeline-lib";
import { Publisher } from "../../lib/kafka/publisher";
import { IKafkaSettings } from "../../lib/kafka/interfaces";
import { ILoggable } from "../../app/interfaces/loggable";
import config from "./config";
import * as Kafka from "node-rdkafka";
import {KafkaConfig} from "../../app/kafka/config";

export type ProducerConfigBuilder = (
  brokerList: string, clientId: string,
) => IProducerConfiguration;

export interface IProducerConfiguration {
  globalConfig: Kafka.IGlobalConfiguration;
  topicConfig: Kafka.ITopicConfiguration;
}

export class Producer {

  private logger: ILoggable;
  private publisher: IPublisher;

  constructor(public settings: IKafkaSettings = config,
              options: any = { logger: console }
  ) {
    this.logger = options.logger;
  }

  public async initPublisher() {

    const clientId = KafkaConfig.getClientId();
    const url = KafkaConfig.getKafkaUrl();

    const kafkaConfig: IProducerConfiguration = KafkaConfig.getDefaultConsumerConfigWithSSL();

    try {
      this.publisher = await this.buildPublisher(url, clientId, () => kafkaConfig);
      return this.publisher;
    } catch (error) {
      this.logger.error(`There was a problem building the kafka publisher ${JSON.stringify(error, null, "\t")}`);
    }
  }

  private buildPublisher(
    brokerList: string, clientId: string,
    configBuilder: ProducerConfigBuilder = defaultProducerConfigBuilder,
  ): Promise<IPublisher> {
    return new Promise<IPublisher>((resolve, reject) => {
      const producerConfiguration: IProducerConfiguration = configBuilder(brokerList, clientId);
      const producer = new Kafka.Producer(
        producerConfiguration.globalConfig,
        producerConfiguration.topicConfig,
      );
      producer.connect();
      producer.setPollInterval(100);

      // Wait for the ready event before proceeding
      producer.on('ready', () => {
        try {
          resolve(new Publisher(producer));
        } catch (err) {
          this.logger.error(`A problem occurred on ready event: ${JSON.stringify(err, null, "\t")}`);
          reject(err);
        }
      });

      producer
        .on("error",  (err) => {
          this.logger.error(`A problem occurred when sending our message ${JSON.stringify(err, null, "\t")}`);
          reject(err);
        })
        .on("event", (event: string) => this.logger.info(
          "KafkaProducer event received", event,
        ))
        .on("event.error", (err: Error) => {
          this.logger.error("KafkaProducer (stream) error", err);
          reject(err);
        })
        .on("event.log", (log: string) => this.logger.info("Debug", log))
        .on("delivery-report", (err: Error) => {
          if (err) {
            this.logger.error("Delivery error", err);
            reject(err);
          }
        });
    });
  }

}
