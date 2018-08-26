import { Subscriber } from "./kafka/subscriber";
import { DeleteKafkaTopics } from "../support/kafka/delete-topics";

const subscriber = new Subscriber();
const deleteKafkaTopics = new DeleteKafkaTopics();

export function requiresKafka() {
  before(() => subscriber.start());
  after(() => subscriber.stop());
}

export async function lastKafkaEvent() {
  return await subscriber.lastEvent;
}

export async function resetKafkaTopic(topic: string) {
  return await deleteKafkaTopics.run(topic);
}
