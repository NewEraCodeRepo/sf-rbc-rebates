import environment from "../../config/environment";
import { IImportSource } from "../interfaces/import_source";
import { ILoggable } from "../interfaces/loggable";
import { SFTPClient } from "../../lib/remote_sftp_client";
import { WatchAndMatchImportZipFile } from "./watch_and_match_import_zip_file";
import { tmpdir } from "os";
import { ISFTPCredentials } from "../../lib/remote_sftp_client/interfaces";

const defaults = environment.sftp;

export class RemoteWatchAndMatchTransactions implements IImportSource {
  private localFilePath = tmpdir() + '/local-wmresult.zip';
  private watchAndMatchImportZipFile: WatchAndMatchImportZipFile;
  private connectionConfig: ISFTPCredentials;
  private logger: ILoggable;
  private remoteFilePath: string;

  constructor(options: {
    connection?: ISFTPCredentials,
    path?: string,
    logger?: ILoggable,
  }) {
    this.remoteFilePath = options.path || defaults.files.watchAndMatchImportZip;
    this.connectionConfig = options.connection || defaults.connection;
    this.logger = options.logger || console;
  }

  public async perform() {
    const client = new SFTPClient(this.connectionConfig, { logger: this.logger });

    try {
      await client.connect();

      this.logger.info("Connecting to SFTP server");
      await client.connect();
      this.logger.info("Connected");

      this.logger.info(`Checking for ${this.remoteFilePath} on SFTP server`);
      const fileDoesExist = await client.fileExistsRemotely(this.remoteFilePath);

      if (!fileDoesExist) {
        throw new Error(`Couldn't find ${this.remoteFilePath}`);
      }

      this.logger.info("File found");

      this.logger.info("Downloading file");
      await client.downloadFile(this.remoteFilePath, this.localFilePath);
      this.logger.info("File Downloaded");

      this.watchAndMatchImportZipFile = new WatchAndMatchImportZipFile({
        filePath: this.localFilePath,
        logger: this.logger
      });

      await this.watchAndMatchImportZipFile.perform();
    } finally {
      this.logger.info("Closing connection to SFTP server");
      await client.disconnect();
      this.logger.info("Connection closed");
    }
  }

  public get transactions() {
    if (this.watchAndMatchImportZipFile) {
      return this.watchAndMatchImportZipFile.transactions;
    } else {
      return [];
    }
  }
}
