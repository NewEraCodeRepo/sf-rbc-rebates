import { Command } from "./command";

export class CloseFileHandle extends Command {
  public respond(handleId: Buffer) {
    this.fileHandles.closeById(handleId);
    this.response.ok();
  }
}
