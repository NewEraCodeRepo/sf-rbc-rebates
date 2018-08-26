import * as colors from 'colors/safe';
import * as env from "env-var";
import { ILoggable } from "../../app/interfaces/loggable";

export class NestedLogger implements ILoggable {
  private nestingLevel = 0;

  constructor(private readonly loggable: ILoggable) {
    this.nestingLevel = 0;
  }

  public debug(...args) {
    if (env.get('LOG_LEVEL').asString() === 'debug') {
      this.log('info', colors.grey.apply(this, args));
    }
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

  public descend() {
    this.nestingLevel += 1;
  }

  public ascend() {
    this.nestingLevel -= 1;
  }

  private log(level, ...args) {
    this.loggable[level](Array(this.nestingLevel).join('  '), ...args);
  }
}
