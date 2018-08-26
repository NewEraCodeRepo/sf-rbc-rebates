import { Producer } from "./producer";
import handlers from "./handlers";
import {KafkaConfig} from "../config";
import { buildPublisher, buildPublishingTransform } from "datapipeline-lib";
import { ILoggable } from "../../interfaces/loggable";

export class RebateProducer extends Producer {

    protected readonly topic = 'rebates';

    constructor(logger: ILoggable = console) {
        super('rebates', logger);
    }

    public async init() {
        const eventHandler = handlers.find((handler) => handler.matches(this.topic));
        const eventSerde = eventHandler!.getEventSerde(KafkaConfig.getClientId());

        const buildEvent = eventHandler!.getBuildRebateEventFn();

        const publisher = await buildPublisher(
            KafkaConfig.getKafkaUrl(),
            KafkaConfig.getClientId(),
            () => this.getProducerConfig()
        );

        const xform = buildPublishingTransform(publisher, this.getTopicName(), KafkaConfig.getMetadataWriter(), eventSerde);

        super.init(eventHandler, eventSerde, buildEvent, publisher, xform);

        return true;
    }
}
