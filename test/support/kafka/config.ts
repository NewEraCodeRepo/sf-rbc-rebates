import environment from "../../../config/environment";

export class Config {
  constructor(public readonly options = environment.kafka) {}

  get consumer() {
    return this.common;
  }

  get producer() {
    return this.common;
  }

  get common() {
    return {
      'client.id': this.options.clientId,
      'group.id': this.options.groupId,
      'metadata.broker.list': this.options.url,
      ...this.options.rdkafka
    };
  }

  get canonicalTopicNames() {
    return Object.keys(this.options.topics);
  }

  get resolvedTopicNames() {
    return Object.values(this.options.topics).map((topic: { name: string }) => {
      return topic.name;
    });
  }

  public resolvedTopicName(canonicalTopicName) {
    const topic = this.options.topics[canonicalTopicName];

    if (!topic) {
      throw new Error(`Could not resolve topic named "${canonicalTopicName} (available: ${this.resolvedTopicNames})"`);
    }

    return topic.name;
  }
}
