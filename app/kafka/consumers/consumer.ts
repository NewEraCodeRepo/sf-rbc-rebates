import { IDelivery, buildSubscriber,
} from "datapipeline-lib";
import { ILoggable } from "../../../app/interfaces/loggable";
import handlers from "./handlers";
import {KafkaConfig} from "../config";
import * as Highland from "highland";
import {UserSetEvent} from "datapipeline-schemas/events/userSetEvent";
import {OfferSetEvent} from "datapipeline-schemas/events/offerSetEvent";
import {TransactionSetEvent} from "datapipeline-schemas/events/transactionSetEvent";

export class Consumer {
    public lastEvent: Promise<any>;
    public lastDBInsert: Promise<any>;

    private logger: ILoggable;
    private topic: string;
    private eventHandler: any;
    private subscriber: any;

    constructor(topic: string) {
        this.logger = console;
        this.topic =  KafkaConfig.getResolvedTopicName(topic);
        this.eventHandler = handlers.find((handler) => handler.matches(topic));
        const consumerConfig = KafkaConfig.getDefaultConsumerConfigWithSSL(topic);

        // We need to ensure every consumer within a consumer group are listening to
        // the same set of topics. Since our design pattern is mainly revolves around
        // single topic process, we should make sure each group is dedicated to only one
        // topic. If in the future, we want a consumer group listening to multiple topics,
        // we should change the contructor to accept a list of topic instead of just one topic.
        // And the logic to subscribe to the topics must be changed to accept a list of
        // topics instead of just one topic.
        this.subscriber = buildSubscriber(
            KafkaConfig.getKafkaUrl(),
            KafkaConfig.getClientId(),
            KafkaConfig.getGroupId(),
            () => consumerConfig
        );
    }

    public async start() {
        if (this.eventHandler) {
            await this.stream();
        } else {
            throw new Error(`Can't find event handler for topic`);
        }
    }

    public async stop() {
        await this.subscriber.disconnect();
        this.logger.info("Consumer disconnected");
    }

    private async stream() {
        const eventSerde = this.eventHandler.getEventSerde(KafkaConfig.getClientId());
        // If we want to subscribe to multiple topic from this one consumer, we would need
        // a way to pass the array of topic names into the subscribeStream().
        const stream = this.subscriber.subscribeStream([this.topic], eventSerde);

        stream
            .errors((err: Error) => this.logger.error(`${this.topic} stream error: ${err}`))
            .flatMap((message: IDelivery<UserSetEvent | OfferSetEvent | TransactionSetEvent>) => {
                if (message.event) {
                    try {
                      this.logger.info("Consuming message offset: ", message.offset);
                      return Highland(this.eventHandler.process(message, this.logger));
                    } catch (err) {
                      this.logger.error(err);
                    }
                }
            })
            .done(() => {
                this.logger.info(`${this.topic} subscriber disconnected`);
                return this.subscriber.disconnect();
            });
    }
}
