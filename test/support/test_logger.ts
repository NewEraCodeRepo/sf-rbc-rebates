import { ILoggable } from "../../app/interfaces/loggable";
import * as util from "util";

interface LogLine {
  level: string;
  message: string;
}

export class TestLogger implements ILoggable {
  private lines: LogLine[] = [];

  public debug(...args: any[]) {
      this.store('DEBUG', ...args);
  }

  public info(...args: any[]) {
      this.store('INFO', ...args);
  }

  public error(...args: any[]) {
      this.store('ERROR', ...args);
  }

  public warn(...args: any[]) {
      this.store('WARN', ...args);
  }

  public toString() {
      return this.lines.map((line) => `${line.level}: ${line.message}`).join("\n");
  }

  private store(level: string, ...args: any[]) {
      this.lines.push({ level, message: this.format(...args) });
  }

  private format(...args: any[]) {
    return args.map((arg) => util.format(arg)).join(" ");
  }
}
