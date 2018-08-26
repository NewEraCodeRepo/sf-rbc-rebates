import * as SSH from "ssh2";
import { ILoggable } from "../../app/interfaces/loggable";
import { FileRepository } from "./file_repository";
import { SSHConnection } from "./ssh_connection";

const RANDOM_PORT = 0;
const BIND_TO_ALL_NETWORK_INTERFACES = '0.0.0.0';

/**
 * An SFTP server which can be used to serve virtual files.
 *
 * @example
 * ```typescript
 * const server = new SFTPServer({ privateKeys: [RSA_PRIVATE_KEY] })
 * server.files.add('/example.txt', 'Content for example.txt');
 * server.start();
 * ```
 */
export class SFTPServer {
  public readonly privateKeys: string[];
  public readonly host: string;
  public readonly logger: ILoggable;
  public readonly preferredPort?: number;
  public readonly files: FileRepository;
  private sshServer: SSH.Server;
  private connectionInfo: { port: number, family: string, address: string };

  constructor(options: {
    port?: number,
    host?: string,
    logger?: ILoggable,
    privateKeys: string[],
  } = { privateKeys: [] }) {
    if (!options.privateKeys) {
      throw new Error("Please provide at least one private key (e.g. RSA)");
    }

    this.preferredPort = options.port;
    this.host = options.host || BIND_TO_ALL_NETWORK_INTERFACES;
    this.logger = options.logger || console;
    this.privateKeys = options.privateKeys;
    this.files = new FileRepository(this.logger);
  }

  public get port() {
    return this.connectionInfo.port;
  }

  public get address() {
    return this.connectionInfo.address;
  }

  public get connectionConfig() {
    return {
      algorithms: {
        serverHostKey: ["ssh-rsa", "ssh-dss"],
      },
      host: this.address,
      port: this.port.toString(),
      readyTimeout: 60000,
      password: 'any',
      username: 'any',
};
  }

  public async start() {
    return new Promise((resolve) => {
      this.sshServer = new SSH.Server({ hostKeys: this.privateKeys });

      this.sshServer.on('connection', async (client) => {
        const connection = new SSHConnection(client, this);
        await connection.start();
      });

      this.sshServer.on('error', this.logger.error);

      this.sshServer.listen(this.preferredPort || RANDOM_PORT, this.host, () => {
        this.connectionInfo = this.sshServer.address();
        this.logger.info(`SFTP server started on ${this.address}:${this.port}`);
        resolve();
      });
    });
  }

  public async stop() {
    return new Promise((resolve) => {
      this.sshServer.close(resolve);
    });
  }
}
