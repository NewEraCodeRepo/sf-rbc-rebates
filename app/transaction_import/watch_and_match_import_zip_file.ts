import * as path from 'path';
import environment from '../../config/environment';
import { readFileSync, chmodSync, createReadStream, createWriteStream, statSync } from "fs";
import { ParseOne } from "unzipper";
import { CSVImportString } from "./csv_import_string";
import { tmpdir } from "os";
import { ILoggable } from "../interfaces/loggable";
import { IImportSource } from "../interfaces/import_source";

const defaults = environment.sftp;

export class WatchAndMatchImportZipFile implements IImportSource {
  // 7 = Readable, writable, executable by the user
  // 5 = Readable and writable by the group
  // 5 = Readable and writable by everyone else
  private readonly CSV_FILE_PERMISSIONS = '755';

  private readonly filePath;
  private readonly destinationDir: string;
  private csvImportString: CSVImportString;
  private logger: ILoggable;

  constructor(options: {
    filePath?: string,
    destinationDir?: string,
    logger?: ILoggable
  }) {
    this.filePath = options.filePath || defaults.files.watchAndMatchImportZip;
    this.destinationDir = options.destinationDir || tmpdir();
    this.logger = options.logger || console;
  }

  private get fileNameWithoutExtension() {
    return path.parse(this.filePath).name;
  }

  private get destinationPath() {
    return `${this.destinationDir}/${this.fileNameWithoutExtension}.csv`;
  }

  public async perform() {
    this.logger.info('Checking file exists');
    this.assertFileExists();

    this.logger.info('Unzipping CSV file');
    await this.unzipCSVFile();

    this.logger.info('Setting permissions');
    this.setPermissionsOnCSVFile();

    this.logger.info('Importing data from CSV file');
    await this.importDataFromCSVFile();
  }

  private setPermissionsOnCSVFile() {
    chmodSync(this.destinationPath, this.CSV_FILE_PERMISSIONS);
  }

  private async importDataFromCSVFile() {
    const buffer = readFileSync(this.destinationPath);
    const csv = buffer.toString();
    this.csvImportString = new CSVImportString(csv, this.logger);
    await this.csvImportString.perform();
  }

  public get transactions() {
    return this.csvImportString ? this.csvImportString.transactions : [];
  }

  private assertFileExists() {
    statSync(this.filePath);
  }

  private async unzipCSVFile() {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(this.filePath)
        .pipe(ParseOne())
        .pipe(createWriteStream(this.destinationPath));

      stream.on("error", reject);
      stream.on("close", resolve);
    });
  }

}
