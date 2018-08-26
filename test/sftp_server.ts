import environment from "../config/environment";
import { readFixture, readFixtureBuffer } from "./support/fixtures";
import { SFTPServer } from "../lib/virtual_sftp_server";

const RSA_PRIVATE_KEY = readFixture('rsa.key');
const WATCH_AND_MATCH_IMPORT_ZIP = readFixtureBuffer('import/wmresult.zip');
const config = environment.sftp;

const server = new SFTPServer({
  port: config.connection.port,
  privateKeys: [RSA_PRIVATE_KEY]
});

server.files.add(config.files.watchAndMatchImportZip, WATCH_AND_MATCH_IMPORT_ZIP);

server.start();
