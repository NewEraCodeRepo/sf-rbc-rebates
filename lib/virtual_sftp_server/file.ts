import * as FILE_MODES from "constants";
import { basename, dirname } from "path";
import { FileEntry, Attributes } from "ssh2-streams";

const REGULAR_FILE = FILE_MODES.S_IFREG;
const USER_ALL_PERMISSIONS = FILE_MODES.S_IRWXU;
const GROUP_ALL_PERMISSIONS = FILE_MODES.S_IRWXG;
const OTHERS_ALL_PERMISSIONS = FILE_MODES.S_IRWXO;

const FILE_WITH_ALL_PERMISSIONS = (
  /* tslint:disable-next-line:no-bitwise */
  REGULAR_FILE | USER_ALL_PERMISSIONS | GROUP_ALL_PERMISSIONS | OTHERS_ALL_PERMISSIONS
);

const EMPTY_BODY = new Buffer('');

export class File {
  constructor(
    public readonly path: string,
    public readonly body: Buffer | string = EMPTY_BODY
  ) {}

  get byteSize() {
    return this.body.toString().length;
  }

  get fileNameWithoutPath() {
    return basename(this.path);
  }

  get directoryPath() {
    return dirname(this.path);
  }

  get attributes(): Attributes {
    return {
      mode: FILE_WITH_ALL_PERMISSIONS,
      uid: 0,
      gid: 0,
      size: this.byteSize,
      atime: Date.now(),
      mtime: Date.now()
    };
  }

  public toFileEntry(): FileEntry {
    return {
      filename: this.fileNameWithoutPath,
      longname: 'irrelevant',
      attrs: this.attributes
    };
  }
}
