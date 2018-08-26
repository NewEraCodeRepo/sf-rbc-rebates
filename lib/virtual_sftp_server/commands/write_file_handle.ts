import { Command } from "./command";

export class WriteFileHandle extends Command {
    public respond(handleId: Buffer, offset: number, data: Buffer) {
        const fileHandle = this.fileHandles.findById(handleId);

        if (fileHandle) {
            if (fileHandle.isOpen) {
                this.files.add(fileHandle.file.path, data);
                this.response.ok();
            } else {
                this.response.end();
            }
        } else {
            this.response.failure();
        }
    }
}
