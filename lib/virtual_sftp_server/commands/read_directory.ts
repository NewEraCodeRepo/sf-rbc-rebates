import { Command } from "./command";

// The client calls this command repeatedly until all listings have been sent
// at which point the stream is closed.
export class ReadDirectory extends Command {
  public respond(handleId: Buffer) {
    const directoryHandle = this.fileHandles.findById(handleId);

    if (!directoryHandle) {
      return this.response.failure();
    }

    const filesInDirectory = this.files.within(directoryHandle.path);

    if (filesInDirectory && directoryHandle.isOpen) {
      this.response.sendFileListings(filesInDirectory);
    } else {
      this.response.end();
    }

    directoryHandle.close();
  }
}
