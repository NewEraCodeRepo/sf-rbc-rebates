import {SFTPClient} from "../../lib/remote_sftp_client";
import { ILoggable } from "../../app/interfaces/loggable";
import { ISFTPCredentials } from "../../lib/remote_sftp_client/interfaces";

export class SFTPUploader {
    private logger: ILoggable;
    private connectionConfig: ISFTPCredentials;
    private sourceFilePath: string;
    private remoteFilePath: string;

    constructor(options: { logger: ILoggable, connectionConfig: ISFTPCredentials }, sourceFilePath: string, remoteFilePath: string ) {
        this.logger = options.logger;
        this.connectionConfig = options.connectionConfig;
        this.sourceFilePath = sourceFilePath;
        this.remoteFilePath = remoteFilePath;
    }

    public async perform() {
        try {
            const client = new SFTPClient(this.connectionConfig, {logger: this.logger});

            await client.connect();
            await client.uploadFile(this.sourceFilePath, this.remoteFilePath);
            await client.disconnect();
        } catch (err) {
            throw new Error(`[RM] - Error uploading to SFTP... ${err}`);
        }
    }
}
