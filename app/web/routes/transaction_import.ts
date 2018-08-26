import {app, viewContext} from "./support";
import {TransactionImport} from "../../transaction_import/index";
import {TransactionImportDetailsRepository} from "../../database/repositories/transaction_import_details_repository";
import {LogStream} from "../log_stream";
import {CSVImportString} from "../../transaction_import/csv_import_string";
import { RemoteWatchAndMatchTransactions } from "../../transaction_import/remote_watch_and_match_transactions";

app.get("/transaction_import", async (request, response) => {
  const transactionImportDetails = await TransactionImportDetailsRepository.findAll({
    order: { inserted_at: 'DESC' }
  });

  response.render("transaction_import/index", viewContext({
    transactionImportDetails,
    title: "Transaction Import Syncs",
  }));
});

app.post("/transaction_import/sync", async (request, response) => {
  const logger = new LogStream(response);
  const source = new RemoteWatchAndMatchTransactions({ logger });

  await TransactionImport.perform(source, { logger });

  response.end();
});

app.get("/transaction_import/upload", async (request, response) => {
  response.render("transaction_import/upload", viewContext({
    title: "Upload transactions",
  }));
});

app.post("/transaction_import/upload", async (request, response) => {
  const logger = new LogStream(response);
  const source = new CSVImportString(request.body.csv);

  await TransactionImport.perform(source, { logger });
  response.end();
});

app.post("/transaction_import/delete", async (request, response) => {
  await TransactionImportDetailsRepository.bulkDelete(request.body.ids);
  response.redirect("/transaction_import");
});

app.post("/transaction_import/delete-all", async (request, response) => {
  await TransactionImportDetailsRepository.truncate();
  response.redirect("/transaction_import");
});

export default app;
