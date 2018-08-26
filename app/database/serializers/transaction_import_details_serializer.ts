import { ITransferDetails } from '../../models/transfer_details';
import { TransactionImportDetailsRecord } from '../records/transaction_import_details_record';
import { TransferStatus } from "../../interfaces/transfer_status";

export class TransactionImportDetailsSerializer {
  public static serialize(object: ITransferDetails): TransactionImportDetailsRecord {
    return {
      id: object.id,
      started_at: object.startedAt,
      finished_at: object.finishedAt,
      status: object.status,
      number_of_items: object.numberOfItems
    };
  }

  public static deserialize(record: TransactionImportDetailsRecord): ITransferDetails {

    return {
      id: record.id,
      startedAt: record.started_at,
      finishedAt: record.finished_at,
      status: record.status  as TransferStatus,
      numberOfItems: record.number_of_items
    };
  }
}
