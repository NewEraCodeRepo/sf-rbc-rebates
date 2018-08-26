import * as SSH from "ssh2";
import { SFTPSession } from "./sftp_session";
import { SFTPServer } from ".";
import { SFTPStream } from "ssh2-streams";

/**
 * Represents the SSH connection that the SFTP session exists within. Handles
 * negotiating the authentication and accepting a new SFTP session with the
 * client.
 */
export class SSHConnection {
  constructor(
    private readonly client: SSH.Connection,
    private readonly server: SFTPServer
  ) {}

  get logger() {
    return this.server.logger;
  }

  public async start() {
    this.client.on('authentication', this.acceptAnyAuthentication);
    this.client.on('session', this.acceptSSHSession.bind(this));
    this.client.on('error', this.logger.error);
  }

  private acceptSSHSession(acceptSSHSession: () => SSH.Session) {
    const session = acceptSSHSession();
    session.on('sftp', this.startSFTPSession.bind(this));
  }

  private acceptAnyAuthentication(authentication: SSH.AuthContext) {
    authentication.accept();
  }

  private startSFTPSession(acceptSFTPStream: () => SFTPStream) {
    const stream = acceptSFTPStream();
    const sftpSession = new SFTPSession(stream, this.server);
    sftpSession.start();
  }
}
