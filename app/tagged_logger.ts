import { ILoggable } from "../app/interfaces/loggable";

// Example:
// const taggedLogger = new TaggedLogger(logger, 'a', 'b')
// taggedLogger.info('hello') // => Logs "[a] [b] hello" through the logger

export class TaggedLogger implements ILoggable {
  private formattedPrefixes: string;

  constructor(
    private readonly logger: ILoggable,
    ...prefixes: string[]
  ) {
    this.formattedPrefixes = prefixes.map((prefix) => `[${prefix}]`).join(' ');
  }

  public debug(...args) {
    this.log('debug', ...args);
  }

  public info(...args) {
    this.log('info', ...args);
  }

  public warn(...args) {
    this.log('warn', ...args);
  }

  public error(...args) {
    this.log('error', ...args);
  }

  private log(level, ...args) {
    this.logger[level](this.formattedPrefixes, ...args);
  }
}
