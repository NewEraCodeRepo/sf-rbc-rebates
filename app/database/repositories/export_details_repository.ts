import { ExportDetailsRecord } from "../records/export_details_record";
import { ExportDetailsSerializer } from "../serializers/export_details_serializer";
import { ITransferDetails } from "../../models/transfer_details";
import { Repository } from "./repository";

class RepositoryForExportDetails extends Repository<ITransferDetails> {
    constructor(
        record = ExportDetailsRecord,
        serializer = ExportDetailsSerializer
    ) {
        super(record, serializer);
    }

}

export const ExportDetailsRepository = new RepositoryForExportDetails();
