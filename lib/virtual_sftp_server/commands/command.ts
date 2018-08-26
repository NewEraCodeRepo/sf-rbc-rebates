import { Response } from "../response";
import { SFTPSession } from "../sftp_session";

export abstract class Command {
  constructor(
    protected readonly response: Response,
    private readonly session: SFTPSession
  ) {}

  get files() {
    return this.session.files;
  }

  get fileHandles() {
    return this.session.fileHandles;
  }

  get logger() {
    return this.session.logger;
  }
}
