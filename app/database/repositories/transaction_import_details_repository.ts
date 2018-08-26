import { TransactionImportDetailsRecord } from "../records/transaction_import_details_record";
import { TransactionImportDetailsSerializer } from "../serializers/transaction_import_details_serializer";
import { ITransferDetails} from "../../models/transfer_details";
import { Repository } from "./repository";

class RepositoryForTransactionImportDetails extends Repository<ITransferDetails> {
  constructor(
    record = TransactionImportDetailsRecord,
    serializer = TransactionImportDetailsSerializer
  ) {
    super(record, serializer);
  }

}

export const TransactionImportDetailsRepository = new RepositoryForTransactionImportDetails();
