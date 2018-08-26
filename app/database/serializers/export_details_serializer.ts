import { ITransferDetails } from '../../models/transfer_details';
import { ExportDetailsRecord } from '../records/export_details_record';
import { TransferStatus } from "../../interfaces/transfer_status";

export class ExportDetailsSerializer {
    public static serialize(object: ITransferDetails): ExportDetailsRecord {
        return {
            id: object.id,
            started_at: object.startedAt,
            finished_at: object.finishedAt,
            status: object.status,
            number_of_items: object.numberOfItems
        };
    }

    public static deserialize(record: ExportDetailsRecord): ITransferDetails {

        return {
            id: record.id,
            startedAt: record.started_at,
            finishedAt: record.finished_at,
            status: record.status  as TransferStatus,
            numberOfItems: record.number_of_items
        };
    }
}
