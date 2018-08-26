import { Command } from "./command";

export class OpenDirectory extends Command {
  public respond(path: string) {
    const handle = this.fileHandles.openPath(path);
    this.response.sendFileHandle(handle);
  }
}
