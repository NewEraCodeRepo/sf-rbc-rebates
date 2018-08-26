import { FileHandle } from "./file_handle";
import { File } from "./file";
import { ResolveRelativePath } from "./commands/resolve_relative_path";

export class FileHandleRepository {
  private collection: { [identifier: string]: FileHandle } = {};

  public createForPath(path: Buffer | string, file?: File) {
    path = this.normalizePath(path);
    file = file || new File(path);
    const handle = new FileHandle(file);
    this.collection[handle.identifier] = handle;
    return handle;
  }

  public findById(identifier: Buffer | string): FileHandle | undefined {
    identifier = this.normalizeIdentifier(identifier);
    return this.collection[identifier];
  }

  public closeById(identifier: Buffer | string) {
    identifier = this.normalizeIdentifier(identifier);
    const handle = this.collection[identifier];
    handle.close();
    delete this.collection[identifier];
  }

  public openPath(path: Buffer | string, file?: File) {
    const handle = this.createForPath(path, file);
    handle.open();
    return handle;
  }

  private normalizeIdentifier(identifier: Buffer | string) {
    return identifier.toString();
  }

  private normalizePath(path: Buffer | string) {
    return ResolveRelativePath.for(path.toString());
  }
}
