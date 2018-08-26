import * as moment from "moment";
import * as path from "path";
import environment from '../../../config/environment';
import { ILoggable } from "../../../app/interfaces/loggable";
import {IRebate} from "../../../app/models/rebate";
import {ITransferDetails} from "../../../app/models/transfer_details";
import { TransferStatus } from "../../../app/interfaces/transfer_status";
import {CSVGenerator} from "../csv_generator";
import {ZipGenerator} from "../zip_generator";
import {SFTPUploader} from "../sftp_uploader";
import {RebateRepository} from "../../../app/database/repositories/rebate_repository";
import { ISFTPCredentials } from "../../../lib/remote_sftp_client/interfaces";
import { tmpdir } from "os";
import { ExportDetailsRepository } from "../../../app/database/repositories/export_details_repository";
import { RebateProducer } from "../../kafka/producers/rebate_producer";
import { UnfulfilledRebateReportCreate } from "../../transaction_processing/report/unfulfilled_rebate_create";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import {RebateJournalReportCreate} from "../../transaction_processing/report/rebate_journal_create";

const defaults = environment.sftp;

export class RebateExport {
    public static async perform(options: any) {
        const rebateExport = new RebateExport(options);
        await rebateExport.perform();
        return rebateExport;
    }

    public remoteFileZipPath: string;
    private logger: ILoggable;
    private connectionConfig: ISFTPCredentials;
    private cachedRebates: IRebate[];
    private exportDetails: ITransferDetails;
    private uploadedToSFTP: boolean;
    private rebateProducer: RebateProducer;

    constructor( options: { logger: ILoggable, connectionConfig?: ISFTPCredentials, remoteFilePath?: string, } ) {
        this.logger = options.logger || console;
        this.connectionConfig = options.connectionConfig || defaults.connection;
        this.remoteFileZipPath = options.remoteFilePath || defaults.files.rebateResultsExportZip;
    }

    // TODO - consider adding retry functionality if exported is interrupted. Might be better to handle upstream.
    public async perform() {
        try {
            const rebatesToExport = await this.rebatesToExport();

            if (rebatesToExport.length > 0) {
                this.logger.info("Export starting...", `${rebatesToExport.length} records to export...`);

                await this.recordExportStart();
                await this.generateCSV();
                await this.generateZip();
                await this.uploadToSFTP();
                await this.createJournalRecords();
                const updatedRebateIds = await this.updateExportedRebates();
                await this.publishRebates(updatedRebateIds);
                await this.recordExportEnd(TransferStatus.Complete);

                this.logger.info("Export finishing...");
            } else {
                this.logger.info("No rebates to export...");
            }
        } catch (err) {
            await this.recordExportEnd(TransferStatus.Failed);
            throw new Error(`[RM] - Error during export... ${err}`);
        }
    }

    private get sourceFileDirectory() {
        return tmpdir();
    }

    private get sourceFileName() {
        return path.parse(this.remoteFilePathWithTimestamp).name;
    }

    private get sourceFileCSVPath() {
        return path.join(this.sourceFileDirectory, `${this.sourceFileName}.csv`);
    }

    private get sourceFileZipPath() {
        return path.join(this.sourceFileDirectory, `${this.sourceFileName}.zip`);
    }

    public get remoteFilePathWithTimestamp() {
        const filePath = this.remoteFileZipPath;
        const fileName = path.basename(filePath);
        const fileNameWithTimestamp = `${path.parse(fileName).name}-${this.timestampForFile}${path.parse(fileName).ext}`;

        return filePath.replace(fileName, fileNameWithTimestamp);
    }

    private async rebatesToExport() {
        this.cachedRebates = this.cachedRebates || await this.findRebatesToExport();
        return this.cachedRebates;
    }

    private async findRebatesToExport() {
        return await RebateRepository.rebatesPendingExportStart();
    }

    private async generateCSV() {
        this.logger.info("Exporting rebates to csv...");

        const csvGenerator = new CSVGenerator(this.cachedRebates, this.sourceFileCSVPath);
        csvGenerator.perform();

        this.logger.info("Rebates exported to csv...");
    }

    private async generateZip() {
        this.logger.info("Zipping csv file..");

        const zipGenerator = new ZipGenerator(this.sourceFileCSVPath, this.sourceFileZipPath);
        await zipGenerator.perform();

        this.logger.info("CSV file zipped...");
    }

    private async createJournalRecords() {
        const rebatesToWrite = await RebateRepository.getRebatesPendingExport();

        for (const rebate of rebatesToWrite) {
            await this.createUnfulfilledRebateReport(Object.assign(rebate, { status: TransactionStatus.PendingFulfillment }) );
            await this.createRebateJournalRecord(Object.assign(rebate, { status: TransactionStatus.PendingFulfillment }) );
        }
        return true;
    }

    private async createUnfulfilledRebateReport(rebate: IRebate) {
        const unfulfilledRebateCreate = new UnfulfilledRebateReportCreate(rebate, this.logger);
        await unfulfilledRebateCreate.perform();
    }

    private async createRebateJournalRecord(rebate: IRebate) {
        const unfulfilledRebateCreate = new RebateJournalReportCreate(rebate, this.logger);
        await unfulfilledRebateCreate.perform();
    }

    private async uploadToSFTP() {
        this.logger.info("Uploading zip to sftp...");

        const uploadOptions = {
            logger: this.logger,
            connectionConfig: this.connectionConfig,
        };

        const sftpUploader = new SFTPUploader(uploadOptions, this.sourceFileZipPath, this.remoteFilePathWithTimestamp);
        await sftpUploader.perform();

        this.uploadedToSFTP = true;

        this.logger.info("Zip uploaded to sftp...");
    }

    private async publishRebates(rebates: string[]) {
        this.logger.info("Rebate publishing start...");

        this.rebateProducer = new RebateProducer();
        await this.rebateProducer.init();

        for (const rebateId of rebates) {
            try {
                const rebate = await RebateRepository.findOrFail(rebateId);
                this.rebateProducer.dispatch(rebate);
            } catch (e) {
                this.logger.error("Rebate to deliver message for not found", e);
            }
        }

        this.logger.info("Rebate publishing end...");
    }

    // TODO - If more exports required then abstract methods to Export Abstract class
    private async updateExportedRebates(): Promise<any> {
        this.logger.info("Rebate update start...");

        const updatedRebateIds = await RebateRepository.rebatesPendingExportEnd();

        this.logger.info("Rebate update end...");

        return updatedRebateIds;
    }

    private async recordExportStart() {
        const startTime = this.now();

        this.exportDetails = await ExportDetailsRepository.insert({
            startedAt: startTime,
            numberOfItems: this.getTotal(),
            status: TransferStatus.InProgress,
        });

        this.logger.info("Record start time...", startTime);
    }

    private async recordExportEnd(result: TransferStatus) {
        const endTime = this.now();

        if (result === TransferStatus.Failed && !this.uploadedToSFTP) {
            await RebateRepository.resetRebatesOnError();
        }

        await ExportDetailsRepository.update(this.exportDetails.id, {
            finishedAt: endTime,
            status: result,
        });

        this.logger.info("Record end time...", endTime);
    }

    private getTotal() {
        return this.cachedRebates.length;
    }

    private get timestampForFile() {
        return moment().format("YYYY-MM-DD");
    }

    private now() {
        return moment.utc().toDate();
    }
}
