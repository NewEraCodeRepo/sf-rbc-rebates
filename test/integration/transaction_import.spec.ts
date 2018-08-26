import { expect } from 'chai';
import * as sinon from 'sinon';
import {readFixture, readFixtureBuffer, fixturePath} from "../support/fixtures";
import {TransactionImport} from "../../app/transaction_import/index";
import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";
import {requiresDatabase} from "../support/database";
import {TransactionType} from "datapipeline-schemas/rebateManagementObject";
import {TransactionForRebateCriteriaRepository} from "../../app/database/repositories/transaction_for_rebate_criteria_repository";
import {TestLogger} from "../support/test_logger";
import {TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import {TransactionImportDetailsRepository} from "../../app/database/repositories/transaction_import_details_repository";
import {CSVImportString} from "../../app/transaction_import/csv_import_string";
import {WatchAndMatchImportZipFile} from "../../app/transaction_import/watch_and_match_import_zip_file";
import { SFTPServer } from '../../lib/virtual_sftp_server';
import { RemoteWatchAndMatchTransactions } from '../../app/transaction_import/remote_watch_and_match_transactions';
import { TransferStatus } from "../../app/interfaces/transfer_status";
import {createTransactionForRebateCriteria} from "../fixtures/transaction_for_rebate_criteria";
import { RebateProducer } from '../../app/kafka/producers/rebate_producer';

describe("Importing transactions", () => {
  requiresDatabase();

  let logger;
  let initStub;
  let dispatchStub;

  beforeEach(() => {
      initStub = sinon.stub(RebateProducer.prototype, 'init').resolves(true);
      dispatchStub = sinon.stub(RebateProducer.prototype, 'dispatch');
      logger = new TestLogger();
  });

  afterEach(() => {
      initStub.restore();
      dispatchStub.restore();
  });

  it('handles an empty string', async () => {
    await importFromCSVString('');
    expect(TransactionForRebateCriteriaRepository.count()).to.eventually.eq(0);
  });

  it('imports a single transaction', async () => {
    await importFromCSVFixture('import/single_transaction.csv');

    const expected = await createTransactionForRebateCriteria ({
      transactionId: '8FBEF8F9-D636-41BF-8838-9C88FB419A46',
      accountId: '117569',
      userId: 'EEB570C0B4B5F597B4262B36013A598B7CC9B0E5',
      rebateCriteriaId: '36168',
      rebateId: '',
      amount: '1670.00',
      processedAt: null,
      transactionType: TransactionType.Qualifying,
      status: TransactionStatus.Pending
    }) as Partial<ITransactionForRebateCriteria>;

    expect(TransactionForRebateCriteriaRepository.count()).to.eventually.eq(2);
    expect(TransactionForRebateCriteriaRepository.last()).to.eventually.deep.eq(expected);
  });

  it('imports multiple transactions', async () => {
    await importFromCSVFixture('import/multiple_transactions.csv');

    const expected = await createTransactionForRebateCriteria ({
        transactionId: 'CF66260A-E729-48C1-86CD-B6B7B98A4A69',
        accountId: '9',
        userId: '0000000000000000000000000000000000000010',
        rebateCriteriaId: '',
        rebateId: '10',
        amount: '54086.33',
        processedAt: null,
        transactionType: TransactionType.Fulfillment,
        status: TransactionStatus.Pending
    }) as Partial<ITransactionForRebateCriteria>;

    expect(TransactionForRebateCriteriaRepository.count()).to.eventually.eq(91);
    expect(TransactionForRebateCriteriaRepository.last()).to.eventually.deep.eq(expected);
  });

  it('can import a ZIP file', async () => {
    await importFromZipFixture('import/wmresult.zip');

    expect(await TransactionForRebateCriteriaRepository.count()).to.eq(90);

    const importDetails = await TransactionImportDetailsRepository.last();
    expect(importDetails.startedAt).not.to.be.undefined;
    expect(importDetails.finishedAt).not.to.be.undefined;
    expect(importDetails.status).to.eq(TransferStatus.Complete);
    expect(importDetails.numberOfItems).to.eq(90);
  });

  it('will throw an error if the ZIP file is not readable', async () => {
    let error;

    try {
      const source = new WatchAndMatchImportZipFile({
        filePath: '/nonexistent.zip'
      });

      await importFromSource(source);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error.message).to.have.string("/nonexistent.zip");
  });

  describe("via SFTP", () => {
    const RSA_PUB_KEY = readFixture('rsa.key');
    let sftpServer;

    beforeEach(async () => {
      sftpServer = new SFTPServer({ privateKeys: [RSA_PUB_KEY], logger});
      await sftpServer.start();
    });

    afterEach(async () => await sftpServer.stop());

    it('will import a zip file from an SFTP server', async () => {
      const zipFileBuffer = readFixtureBuffer('import/wmresult.zip');
      sftpServer.files.add('/wmresult.zip', zipFileBuffer);

      await importFromSFTP('/wmresult.zip');

      expect(await TransactionForRebateCriteriaRepository.count()).to.eq(90);

      const importDetails = await TransactionImportDetailsRepository.last();
      expect(importDetails.startedAt).not.to.be.undefined;
      expect(importDetails.finishedAt).not.to.be.undefined;
      expect(importDetails.status).to.eq(TransferStatus.Complete);
      expect(importDetails.numberOfItems).to.eq(90);
    });

    it("reports an import as failed if the file can't be found", async () => {
      let error;

      try {
        await importFromSFTP('/wmresult.zip');
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error.message).to.eq("Couldn't find /wmresult.zip");

      expect(await TransactionForRebateCriteriaRepository.count()).to.eq(0);

      const importDetails = await TransactionImportDetailsRepository.last();
      expect(importDetails.startedAt).not.to.be.undefined;
      expect(importDetails.finishedAt).not.to.be.undefined;
      expect(importDetails.status).to.eq(TransferStatus.Failed);
      expect(importDetails.numberOfItems).to.eq(0);
    });

    async function importFromSFTP(filePath: string) {
      const source = new RemoteWatchAndMatchTransactions({
        path: filePath,
        connection: sftpServer.connectionConfig,
        logger
      });

      return await importFromSource(source);
    }
  });

  async function importFromCSVString(csvString) {
    const source = new CSVImportString(csvString);
    return await importFromSource(source);
  }

  async function importFromCSVFixture(filename) {
    const csv = readFixture(filename);
    return await importFromCSVString(csv);
  }

  async function importFromZipFixture(filename) {
    const filePath = fixturePath(filename);
    const source = new WatchAndMatchImportZipFile({ filePath, logger });
    return await importFromSource(source);
  }

  async function importFromSource(source) {
    return await TransactionImport.perform(source, { logger });
  }
});
