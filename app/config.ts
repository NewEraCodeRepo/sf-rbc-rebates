import environment from "../config/environment";
import { ILoggable } from "../app/interfaces/loggable";
import { EventEmitter } from "events";

export class Config {
  public readonly env: string;
  public readonly web: { port: number, adminAuth: string };
  public readonly project: { name: string, identifier: string };
  public readonly logger: ILoggable;
  public readonly input: EventEmitter;
  public readonly output: EventEmitter;

  constructor(public readonly options: any = environment) {
    this.env = options.env;
    this.web = options.web;
    this.project = options.project;
    this.logger = options.logger || console;
    this.input = new EventEmitter();
    this.output = new EventEmitter();
  }
}
