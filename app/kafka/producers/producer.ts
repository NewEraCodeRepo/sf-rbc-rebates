import { IProducerConfiguration, IPublisher } from "datapipeline-lib";
import {KafkaConfig} from "../config";
import * as Highland from "highland";
import { ILoggable } from "../../interfaces/loggable";

export abstract class Producer {

    protected topic: string;
    protected producerConfig: IProducerConfiguration;
    protected topicName: string;
    protected eventHandler: any;
    protected publisher: IPublisher;
    protected eventSerde: any;
    protected buildEvent: any;
    protected xform: any;

    private logger: ILoggable;

    constructor(topic: string, logger: ILoggable = console) {
        this.logger = logger;
        this.topic = topic;
        this.producerConfig = KafkaConfig.getDefaultProducerConfigWithSSL();
        this.topicName = KafkaConfig.getResolvedTopicName(this.topic);
    }

    // TODO: change to an eventemitter pattern
    public async dispatch(data: any) {
        return Highland([data])
            .map(this.buildEvent)
            .map(this.xform)
            .each(() => {
                this.logger.info("Event published");
            })
            .errors((err: Error) => {
                this.logger.error("Stream error... " + err);
            });
    }

    protected getProducerConfig() {
        return this.producerConfig;
    }

    protected getTopicName() {
        return this.topicName;
    }

    protected init(handler, eventSerde, buildEvent, publisher, xform) {
        this.eventHandler = handler;
        this.eventSerde = eventSerde;
        this.buildEvent = buildEvent;
        this.publisher = publisher;
        this.xform = xform;
    }
}
