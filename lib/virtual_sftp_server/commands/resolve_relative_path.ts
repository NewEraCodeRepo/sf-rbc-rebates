import { Command } from "./command";
import { File } from "../file";

export class ResolveRelativePath extends Command {
  public static for(path: string) {
    return (path === '.' || path === '') ? '/' : path;
  }

  public respond(path: string) {
    const file = new File(ResolveRelativePath.for(path));
    this.response.sendFileListing(file);
  }
}
