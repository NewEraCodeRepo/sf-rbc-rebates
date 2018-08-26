import { Command } from "./command";

export class ReadFileHandle extends Command {
  public respond(handleId: Buffer) {
    const fileHandle = this.fileHandles.findById(handleId);

    if (fileHandle) {
      if (fileHandle.isOpen) {
        this.response.sendFile(fileHandle);
      } else {
        this.response.end();
      }
    } else {
      this.response.failure();
    }
  }
}
