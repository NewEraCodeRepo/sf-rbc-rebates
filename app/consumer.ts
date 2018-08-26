import { Config } from "./config";

export class Consumer {
  public static start(config: Config = new Config()) {
    const consumer = new Consumer(config);
    consumer.start();
    return consumer;
  }

  constructor(public readonly config: Config) {}

  public start() {
    this.input.on('message', this.receive.bind(this));
  }

  public receive(message: any) {
    // TODO: something more interesting
    this.logger.info("Received message", message);
    this.output.emit('message', `${message.id} is elligible for a rebate`);
  }

  get logger() {
    return this.config.logger;
  }

  get input() {
    return this.config.input;
  }

  get output() {
    return this.config.output;
  }
}
