import { Command } from "./command";

export class FileAttributes extends Command {
  public respond(path: string) {
    const file = this.files.find(path);

    if (file) {
      this.response.sendAttributes(file);
    } else {
      this.response.failure();
    }
  }
}
