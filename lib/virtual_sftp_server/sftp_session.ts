import { SFTPServer } from ".";
import { SFTPStream } from "ssh2-streams";
import { Response } from "./response";
import { FileHandleRepository } from "./file_handle_repository";
import Command from "./commands";

/**
 * Represents the SFTP session within the SSH connection. Handles listening for
 * common SFTP commands from the client. Not all SFTP commands are supported.
 *
 * A reference for the commands can be found at
 * https://www.ssh.com/a/draft-ietf-secsh-filexfer-02.txt
 */
export class SFTPSession {
  public fileHandles = new FileHandleRepository();

  constructor(
    public readonly stream: SFTPStream,
    public readonly server: SFTPServer
  ) {}

  get logger() {
    return this.server.logger;
  }

  get files() {
    return this.server.files;
  }

  public start() {
    this.registerCommand('OPENDIR', Command.OpenDirectory);
    this.registerCommand('STAT', Command.FileAttributes);
    this.registerCommand('LSTAT', Command.FileAttributes);
    this.registerCommand('REALPATH', Command.ResolveRelativePath);
    this.registerCommand('CLOSE', Command.CloseFileHandle);
    this.registerCommand('READDIR', Command.ReadDirectory);
    this.registerCommand('OPEN', Command.OpenFileHandle);
    this.registerCommand('READ', Command.ReadFileHandle);
    this.registerCommand('WRITE', Command.WriteFileHandle);
  }

  private registerCommand(eventName: string, commandHandler: any) {
    this.stream.on(eventName, (requestId, ...args: any[]) => {
      this.logger.info(eventName, requestId, ...args);
      const response = new Response(requestId, this.stream);
      new commandHandler(response, this).respond(...args);
    });
  }
}
