import environment from "../../config/environment";
import { ILoggable } from "../../app/interfaces/loggable";
import * as Kafka from "node-rdkafka";
import * as lib from "node-rdkafka/librdkafka";
import config from "../../lib/kafka/config";

const configTopics = environment.kafka.topics;
const logger: ILoggable = console;

interface TopicConfig {
  name: string;
}

const topics: TopicConfig[] = Object.values(configTopics);
const topicNames = topics.map((topic) => topic.name);

const consumerConfig = {
  'client.id': config.clientId,
  'group.id': config.groupId,
  'metadata.broker.list': config.url,
  'request.required.acks': 1,
};

const perTopicConfig = {};

logger.info(
  '[Status] Starting', `(librdkafka ${lib.librdkafkaVersion}, client: ${config.clientId}/${config.groupId})`
);

const consumer = new Kafka.KafkaConsumer(consumerConfig, perTopicConfig);

consumer.connect();

consumer.on('ready', () => {
  logger.info('[Status] Connected');
  logger.info('[Status] Subscribing to:', topicNames.join(", "));
  logger.info('[Warning] messages may take a while to appear');
  consumer.subscribe(topicNames);
  consumer.consume();
});

consumer.on('error', (error) => {
  logger.error('[Consumer Error]', error);
});

consumer.on('event.error', (error) => {
  logger.error('[Event Error]', error);
});

consumer.on('data', (data) => {
  const tags = ['Message', `${data.topic} #${data.offset}`, data.key];
  const prefix = tags.filter((value) => value).map((tag) => `[${tag}]`).join(' ');
  const message = data.value.toString('utf8');
  logger.info(prefix, message);
});

logger.info('[Status] Connecting...');
consumer.connect();
