import transactionImportDetails from '../fixtures/transaction_import_details';
import { TransactionImportDetailsRepository } from "../../app/database/repositories/transaction_import_details_repository";
import { includeRepositoryTests } from "./shared_repository_tests";

xdescribe('TransactionImportDetailsRepository', () => {
  includeRepositoryTests(TransactionImportDetailsRepository, transactionImportDetails, true);
});
