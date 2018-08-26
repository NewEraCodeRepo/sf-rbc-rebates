import { File } from "./file";
import { ILoggable } from "../../app/interfaces/loggable";

export class FileRepository {

  private paths: { [path: string]: File } = {};

  constructor(private readonly logger: ILoggable = console) {}

  public add(path: string, body: Buffer | string) {
    this.logger.info('Registered file at', path);
    this.paths[path] = new File(path, body);
  }

  public find(path: string): File | undefined {
    return this.paths[path];
  }

  public within(path: string) {
    return this.toArray().filter((file) =>  file.directoryPath === path);
  }

  public toArray() {
    return Object.values(this.paths);
  }

  public each(callback: (file: File) => void) {
    return this.toArray().forEach(callback);
  }

  public map(callback: (file: File) => any) {
    return this.toArray().map(callback);
  }
}
