import { expect } from 'chai';
import {readFixture} from "../support/fixtures";
import {requiresDatabase} from "../support/database";
import { createRebate } from '../fixtures/rebate';
import {RebateRepository} from "../../app/database/repositories/rebate_repository";
import {TestLogger} from "../support/test_logger";
import {TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import { SFTPServer } from '../../lib/virtual_sftp_server';
import {RebateExport} from "../../app/exports/rebates/rebate_export";
import {SFTPClient} from "../../lib/remote_sftp_client";
import { ParseOne } from "unzipper";
import { tmpdir } from "os";
import * as path from "path";
import * as fs from "fs";
import * as moment from "moment";

xdescribe("Export rebates", () => {
    requiresDatabase();

    let logger;
    let sftpServer;
    let sftpClient;
    let exportOptions;
    const RSA_PUB_KEY = readFixture('rsa.key');
    const remoteFilePathZip = "/Import/MyOffers/rmresult/local-rmresult.zip";
    const localFilePathZip = path.join(tmpdir(), "local-rmresult.zip");
    const localFilePathCSV = path.join(tmpdir(), "local-rmresult.csv");

    beforeEach(async () => {
        // new logger
        logger = new TestLogger();

        // delete test files
        deleteFiles();

        // new sftp server
        sftpServer = new SFTPServer({ privateKeys: [RSA_PUB_KEY], logger});
        await sftpServer.start();

        // new sftp client
        sftpClient = new SFTPClient(sftpServer.connectionConfig, { logger });
        await sftpClient.connect();

        // define export options - use test server config
        exportOptions = {
            logger,
            connectionConfig: sftpServer.connectionConfig,
            remoteFilePath: remoteFilePathZip,
        };
    });

    afterEach(async () => {
        await sftpClient.disconnect();
        await sftpServer.stop();
    });

    it('exports a single rebate that is pending extraction', async () => {
        // create rebate pending extraction
        const rebatePendingExtractionOne = await createRebate ( {
            id: "REBATE-PENDING-EXTRACTION",
            status: TransactionStatus.PendingExtraction,
            deliveredAt: null,
        });

        // create rebate pending fulfillment
        const rebatePendingFulfillment = await createRebate ( {
            id: "REBATE-PENDING-FULFILLMENT",
            status: TransactionStatus.PendingFulfillment,
        });

        // create fulfilled rebate
        const fulfilledRebate = await createRebate ( {
            id: "REBATE-FULFILLED",
            status: TransactionStatus.FulfilledTransSuccessful,
        });

        // start export
        const rebateExport = new RebateExport(exportOptions);
        await rebateExport.perform();

        // get file name with timestamp
        const fileNameWithTimeStamp = rebateExport.remoteFilePathWithTimestamp;

        // assert that file was generated in expected location
        const fileExists = await sftpClient.fileExistsRemotely(fileNameWithTimeStamp);
        expect(fileExists).to.eq(true);

        // download file
        await sftpClient.downloadFile(fileNameWithTimeStamp, localFilePathZip);

        // unzip file
        await unzipCSVFile(localFilePathZip, localFilePathCSV);

        // read file
        const buffer = fs.readFileSync(localFilePathCSV);
        const csvString = buffer.toString();

        // parse csv string
        const csvRows = csvString.split("\n");
        const rowCount = csvRows.length;
        const rebateIdOne = csvRows[rowCount - 1].split(",")[0];

        // assert that row count = 3 (incl. header row)
        expect(rowCount).to.eq(2);

        // assert that id matches rebate that was pending extraction
        expect(rebateIdOne).to.eq(rebatePendingExtractionOne.id);
        expect(rebateIdOne).to.not.eq(rebatePendingFulfillment.id);
        expect(rebateIdOne).to.not.eq(fulfilledRebate.id);

    });

    it('exports multiple rebates that are pending extraction', async () => {
        // create rebate pending extraction
        const rebatePendingExtractionOne = await createRebate ( {
            id: "REBATE-PENDING-EXTRACTION-1",
            status: TransactionStatus.PendingExtraction,
            deliveredAt: null,
        });

        const rebatePendingExtractionTwo = await createRebate ( {
            id: "REBATE-PENDING-EXTRACTION-2",
            status: TransactionStatus.PendingExtraction,
            deliveredAt: null,
        });

        const rebatePendingExtractionThree = await createRebate ( {
            id: "REBATE-PENDING-EXTRACTION-3",
            status: TransactionStatus.PendingExtraction,
            deliveredAt: null,
        });

        // create rebate pending fulfillment
        const rebatePendingFulfillment = await createRebate ( {
            id: "REBATE-PENDING-FULFILLMENT",
            status: TransactionStatus.PendingFulfillment,
        });

        // create fulfilled rebate
        const fulfilledRebate = await createRebate ( {
            id: "REBATE-FULFILLED",
            status: TransactionStatus.FulfilledTransSuccessful,
        });

        // start export
        const rebateExport = new RebateExport(exportOptions);
        await rebateExport.perform();

        // get file name with timestamp
        const fileNameWithTimeStamp = rebateExport.remoteFilePathWithTimestamp;

        // assert that file was generated in expected location
        const fileExists = await sftpClient.fileExistsRemotely(fileNameWithTimeStamp);
        expect(fileExists).to.eq(true);

        // download file
        await sftpClient.downloadFile(fileNameWithTimeStamp, localFilePathZip);

        // unzip file
        await unzipCSVFile(localFilePathZip, localFilePathCSV);

        // read file
        const buffer = fs.readFileSync(localFilePathCSV);
        const csvString = buffer.toString();

        // parse csv string
        const csvRows = csvString.split("\n");
        const rowCount = csvRows.length;
        const rebateIdOne = csvRows[rowCount - 3].split(",")[0];
        const rebateIdTwo = csvRows[rowCount - 2].split(",")[0];
        const rebateIdThree = csvRows[rowCount - 1].split(",")[0];

        // assert that row count = 3 (incl. header row)
        expect(rowCount).to.eq(4);

        // assert that id matches first rebate that was pending extraction
        expect(rebateIdOne).to.eq(rebatePendingExtractionOne.id);
        expect(rebateIdOne).to.not.eq(rebatePendingFulfillment.id);
        expect(rebateIdOne).to.not.eq(fulfilledRebate.id);

        // assert that id matches second rebate that was pending extraction
        expect(rebateIdTwo).to.eq(rebatePendingExtractionTwo.id);
        expect(rebateIdTwo).to.not.eq(rebatePendingFulfillment.id);
        expect(rebateIdTwo).to.not.eq(fulfilledRebate.id);

        // assert that id matches third rebate that was pending extraction
        expect(rebateIdThree).to.eq(rebatePendingExtractionThree.id);
        expect(rebateIdThree).to.not.eq(rebatePendingFulfillment.id);
        expect(rebateIdThree).to.not.eq(fulfilledRebate.id);
    });

    it('updates rebates once file exported', async () => {
        // create rebate pending extraction
        const newRebate = await createRebate ( {
            id: "REBATE-NEW",
            status: TransactionStatus.PendingExtraction,
            deliveredAt: null,
        });

        // start export
        const rebateExport = new RebateExport(exportOptions);
        await rebateExport.perform();

        // retrieve rebate
        const rebate = await RebateRepository.findOrFail(newRebate.id);

        // assert that deliveredAt & status have been updated
        const status = rebate.status;
        const deliveredAt = rebate.deliveredAt || "N/A";
        const isValidDate = moment(deliveredAt, "MM/DD/YYYY", true).isValid();

        expect(isValidDate).to.eq(true);
        expect(status).to.eq(TransactionStatus.PendingFulfillment);
    }).timeout(15000);

    it('it resets rebate status if error encountered', async () => {
        // create rebate pending extraction
        const newRebate = await createRebate ( {
            id: "REBATE-NEW",
            status: TransactionStatus.PendingExtraction,
            deliveredAt: null,
        });

        // create error ftp config
        const connectionConfigERROR = {
            algorithms: {
                serverHostKey: ["ssh-rsa", "ssh-dss"],
            },
            host: "ftp.error.com",
            port: "22",
            readyTimeout: 10,
            password: 'error',
            username: 'error',
        };

        // define export options - use error config
        const exportOptionsERROR = {
            logger,
            connectionConfig: connectionConfigERROR,
            remoteFilePath: remoteFilePathZip,
        };

        // start export
        try {
            const rebateExport = new RebateExport(exportOptionsERROR);
            await rebateExport.perform();
        } catch (err) {
            logger.error(err);
        }

        // retrieve rebate
        const rebate = await RebateRepository.findOrFail(newRebate.id);

        // assert status is correct
        const status = rebate.status;

        expect(status).to.eq(TransactionStatus.PendingExtraction);
    }).timeout(15000);

    it('does not export a file if no rebates pending extraction', async () => {
        // start export
        const rebateExport = new RebateExport(exportOptions);
        await rebateExport.perform();

        // assert that no file was generated in expected location
        const fileExists = await sftpClient.fileExistsRemotely(remoteFilePathZip);
        expect(fileExists).to.eq(false);
    }).timeout(15000);

    async function unzipCSVFile(source, target) {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(source)
                .pipe(ParseOne())
                .pipe(fs.createWriteStream(target));

            stream.on("error", reject);
            stream.on("close", resolve);
        });
    }

    function deleteFiles() {
        if (fs.existsSync(localFilePathCSV)) {
            fs.unlinkSync(localFilePathCSV);
        }

        if (fs.existsSync(localFilePathZip)) {
            fs.unlinkSync(localFilePathZip);
        }
    }
});
