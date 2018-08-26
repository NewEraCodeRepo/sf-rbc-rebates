import * as SSH from "ssh2";
import { File } from "./file";
import { SFTPStream } from "ssh2-streams";
import { FileHandle } from "./file_handle";

const STATUS = SSH.SFTP_STATUS_CODE;

/**
 * Used by Commands to respond to SFTP requestes over the SFTP session.
 */
export class Response {
  constructor(
    public readonly requestId: number,
    private readonly stream: SFTPStream
  ) {}

  public sendAttributes(file: File) {
    this.stream.attrs(this.requestId, file.attributes);
  }

  public sendFileListing(file: File) {
    this.sendFileListings([file]);
  }

  public sendFileListings(files: File[]) {
    const entries = files.map((file) => file.toFileEntry());
    this.stream.name(this.requestId, entries);
  }

  public sendFileHandle(handle: FileHandle) {
    this.stream.handle(this.requestId, handle.identifierBuffer());
  }

  public sendFile(handle: FileHandle) {
    this.stream.data(this.requestId, handle.read());
    handle.close();
  }

  public end() {
    this.stream.status(this.requestId, STATUS.EOF);
  }

  public ok() {
    this.stream.status(this.requestId, STATUS.OK);
  }

  public failure() {
    this.stream.status(this.requestId, STATUS.FAILURE);
  }
}
