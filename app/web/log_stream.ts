import { ILoggable } from "../interfaces/loggable";
import * as util from 'util';

export class LogStream implements ILoggable {
  constructor(
    public readonly stream: any,
    private readonly secondary: ILoggable = console
) {}

  public debug(...args: any[]) {
    this.write('DEBUG', ...args);
    this.secondary.debug(...args);
  }

  public info(...args: any[]) {
    this.write('INFO', ...args);
    this.secondary.info(...args);
  }

  public error(...args: any[]) {
    this.write('ERROR', ...args);
    this.secondary.error(...args);
  }

  public warn(...args: any[]) {
    this.write('WARN', ...args);
    this.secondary.warn(...args);
  }

  private write(level: string, ...args: any[]) {
    const message = args.map((arg) => util.format(arg)).join(" ");
    this.stream.write(`${level}: ${message}\n`);
  }
}
