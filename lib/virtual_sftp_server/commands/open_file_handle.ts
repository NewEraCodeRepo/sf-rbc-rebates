import { Command } from "./command";
import { SFTPStream } from "ssh2-streams";

export class OpenFileHandle extends Command {
    public respond(path: string, openMode: number, attributes: any) {

        if (openMode === SFTPStream.OPEN_MODE.READ) {
            this.openForReading(path);
        } else {
            this.openForWriting(path);
        }
    }

    private openForReading(path: string) {
        const file = this.files.find(path);

        if (file) {
            const handle = this.fileHandles.openPath(path, file);
            this.response.sendFileHandle(handle);
        } else {
            this.response.failure();
        }
    }

    private openForWriting(path: string) {
        const handle = this.fileHandles.openPath(path);
        this.response.sendFileHandle(handle);
    }
}
