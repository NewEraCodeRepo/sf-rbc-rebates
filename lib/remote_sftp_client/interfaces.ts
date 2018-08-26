import { Readable } from "stream";

export interface IRemoteSFTPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  existsOnFtp(path: string): Promise<boolean>;
  fetchFileFromFTP(path: string): Promise<Readable>;
  placeFileOnFTP(localPath: string, remotePath: string): Promise<any>;
}

export interface ISFTPCredentials {
  algorithms?: { serverHostKey: string[] };
  host?: string;
  port?: string;
  username?: string;
  password?: string;
}

export interface ISFTPClient {
  fileExistsRemotely(remotePath: string): Promise<boolean>;
  downloadFile(remotePath: string, localPath: string): Promise<void>;
  uploadFile(localPath: string, remotePath: string): Promise<any>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
