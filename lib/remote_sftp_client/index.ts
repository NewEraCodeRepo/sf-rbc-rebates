import { createWriteStream} from "fs";
import { IRemoteSFTPClient, ISFTPClient } from "./interfaces";
import { RemoteSFTPClient } from "../../lib/remote_sftp_client/remote_sftp_client";
import { ISFTPCredentials } from "../../lib/remote_sftp_client/interfaces";
import { ILoggable } from "../../app/interfaces/loggable";

/**
 * SFTPClient
 */
export class SFTPClient implements ISFTPClient {

  private ftpReadClient: IRemoteSFTPClient;
  private ftpWriteClient: IRemoteSFTPClient;
  private logger: ILoggable;

  constructor(credentials: ISFTPCredentials,
              options: any = { logger: console }
  ) {
    this.logger = options.logger;
    this.ftpReadClient = new RemoteSFTPClient(credentials, options.logger);
    this.ftpWriteClient = new RemoteSFTPClient(credentials, options.logger);
  }

  /**
   * Connect to SFTP server
   * if the client is not already
   * connected
   * @returns {Promise<void>}
   */
  public async connect(): Promise<void> {
    if (!this.ftpReadClient.isConnected()) {
      await this.ftpReadClient.connect();
    }
    if (!this.ftpWriteClient.isConnected()) {
      await this.ftpWriteClient.connect();
    }
  }

  /**
   * Disconnect from the SFTP server
   * if the client is currently connected
   * @returns {Promise<void>}
   */
  public async disconnect(): Promise<void> {
    if (this.ftpReadClient.isConnected()) {
      await this.ftpReadClient.disconnect();
    }
    if (this.ftpWriteClient.isConnected()) {
      await this.ftpWriteClient.disconnect();
    }
  }

  /**
   * fileExistsRemotely
   *
   * Checks if file exists on remote
   * ftp server
   * @param {string} remotePath
   * @returns {Promise<boolean>}
   */
  public async fileExistsRemotely(remotePath: string): Promise<boolean> {
    try {
      return await this.ftpReadClient.existsOnFtp(remotePath);
    } catch (e) {
      this.logger.error(e.message);
      throw e;
    }
  }

  /**
   * downloadFile
   *
   * Retrieve file from ftp server
   * as a read stream and pipe to
   * a write stream
   * @param {string} remotePath
   * @param {string} localPath
   * @returns {Promise<void>}
   */
  public async downloadFile(remotePath: string, localPath: string): Promise<void> {
    const writeStream = createWriteStream(localPath);

    try {
      const readStream = await this.ftpReadClient.fetchFileFromFTP(remotePath);

      return new Promise((resolve, reject) => {
        readStream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("close", resolve);
        readStream.pipe(writeStream);

      }).then(() => {
        readStream.removeAllListeners();
        writeStream.removeAllListeners();

      }).catch((e) => {
        this.logger.error(e.message);
        throw e;
      });
    } catch (e) {
      this.logger.error(e.message);
      throw e;
    }
  }

    /**
     * uploadFile
     *
     * Uploads file to sftp server
     * @param {string} localFilePath
     * @param {string} remoteFilePath
     * @returns {Promise<any>}
     */
    public async uploadFile(localFilePath: string, remoteFilePath: string): Promise<any> {
      try {
          return await this.ftpWriteClient.placeFileOnFTP(localFilePath, remoteFilePath);
      } catch (e) {
          throw e;
      }
    }
}
