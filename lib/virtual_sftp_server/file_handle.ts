import { File } from "./file";
import * as uuid from "uuid/v1";

enum State { Closed, Open }

/*
 * Represents an instance of a file being requested by a client.
 */
export class FileHandle {
  private state = State.Closed;

  constructor(
    public readonly file: File,
    public readonly identifier: string = uuid()
  ) {}

  get path() {
    return this.file.path;
  }

  get isOpen() {
    return this.state === State.Open;
  }

  public read() {
    return this.file.body;
  }

  public open() {
    this.state = State.Open;
  }

  public close() {
    this.state = State.Closed;
  }

  public identifierBuffer() {
    return new Buffer(this.identifier);
  }
}
