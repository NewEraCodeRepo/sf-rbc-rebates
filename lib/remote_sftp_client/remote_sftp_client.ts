import * as fs from "fs";
import { basename, dirname } from "path";
import { IRemoteSFTPClient, ISFTPCredentials } from "./interfaces";
import * as client from "ssh2-sftp-client";

/**
 * Simple node.js ssh2 sftp client
 * @see {@url https://github.com/jyu213/ssh2-sftp-client}
 */
export class RemoteSFTPClient implements IRemoteSFTPClient {
    public connected: boolean = false;
    private FTPCredentials: ISFTPCredentials;
    private sftp: any;
    constructor(credentials: ISFTPCredentials, private logger = console) {
        this.FTPCredentials = credentials;
        this.sftp = new client();
        this.sftp.client.on("error", (err: Error) => {
          this.logger.error(`There with the SFTP client: ${err.message}`);
        });
    }

    // connect to ftp server
    public async connect(): Promise<void> {
        try {
            await this.sftp.connect(this.FTPCredentials);
            this.connected = true;
            this.logger.debug("SFTP: Connected");
        } catch (e) {
            this.logger.error(`There was a problem connecting to the SFTP server: ${e.message}`);
            throw e;
        }
    }

    // disconnect from ftp server
    public async disconnect(): Promise<void> {
        try {
            await this.sftp.end();
            this.sftp.client.removeAllListeners();
            this.connected = false;
            this.logger.debug("SFTP: Disconnected");
        } catch (e) {
            this.logger.error(`There was a problem disconnecting from the SFTP server: ${e.message}`);
            throw e;
        }
    }

    // check if ftp client is connected to ftp server
    public isConnected(): boolean {
        return this.connected;
    }

    // check if file exists on ftp server
    public async existsOnFtp(path: string): Promise<boolean> {
        const dir = dirname(path);
        const fileName = basename(path);
        try {
            const listings = await this.sftp.list(dir);
            interface IListing {
                name: string;
            }
            return listings
                .map((listing: IListing) => listing.name)
                .includes(fileName);
        } catch (e) {
            this.logger.error(`The file does not exist on the SFTP server: ${e.message}`);
            throw e;
        }
    }

    // get file from ftp server
    public async fetchFileFromFTP(path: string): Promise<fs.ReadStream> {
        return this.sftp.get(path, true, null);
    }

    // place file on ftp server
    public async placeFileOnFTP(localPath: string, remotePath: string): Promise<any> {
        return this.sftp.put(localPath, remotePath);
    }
}
