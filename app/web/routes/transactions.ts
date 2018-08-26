import { app, viewContext } from "./support";
import { RebateCriteriaRepository } from "../../database/repositories/rebate_criteria_repository";
import { TransactionForRebateCriteriaRepository } from "../../database/repositories/transaction_for_rebate_criteria_repository";
import { UserRepository } from "../../database/repositories/user_repository";
import { TransactionProcessing } from "../../transaction_processing/index";
import { LogStream } from "../log_stream";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import randomDemoId from "../util/random_demo_id";

function parseDate(value) {
  return value && new Date(value);
}

app.get("/transactions", async (request, response) => {
  const transactionsForRebateCriteria = await TransactionForRebateCriteriaRepository.findAll({
    take: 500,
    order: { inserted_at: 'DESC' },
  });

  response.render("transactions/index", viewContext({
      transactionsForRebateCriteria,
      title: "Transactions",
  }));
});

app.get("/transactions/new", async (request, response) => {
  const rebateCriterias = await RebateCriteriaRepository.findAllForTesting();
  const users = await UserRepository.findAll({ take: 100 });

  response.render("transactions/new", viewContext({
    rebateCriterias,
    users,
    title: "New transaction",
  }));
});

app.post("/transactions", async (request, response) => {
  await TransactionForRebateCriteriaRepository.insert({
    transactionId: randomDemoId({ prefix: 'T' }),
    accountId: request.body.accountId,
    amount: request.body.amount,
    basePoints: request.body.basePoints,
    userId: request.body.userId,
    processedAt: null,
    rebateCriteriaId: request.body.rebateCriteriaId,
    rebateId: request.body.rebateId,
    status: TransactionStatus.Pending,
    transactionType: request.body.transactionType,
    transactionDate: parseDate(request.body.transactionDate) || new Date(),
    cardType: request.body.cardType,
    card: request.body.card,
    productCodeExternal: request.body.productCodeExternal,
    tsysCustomerId: request.body.customerId,
    transactionCurrency: 'CAD'
  });

  response.redirect("/transactions");
});

app.post("/transactions/delete", async (request, response) => {
  await TransactionForRebateCriteriaRepository.bulkDelete(request.body.ids);
  response.redirect("/transactions");
});

app.post("/transactions/delete-all", async (request, response) => {
  await TransactionForRebateCriteriaRepository.truncate();
  response.redirect("/transactions");
});

app.post("/transactions/process", async (request, response) => {
  const logStream = new LogStream(response);
  await TransactionProcessing.perform({ logger: logStream });
  response.end();
});

export default app;
