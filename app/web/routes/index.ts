import home from "./home";
import clients from "./clients";
import offers from "./offers";
import rebates from "./rebates";
import transactions from "./transactions";
import transaction_import from "./transaction_import";
import rebate_export from "./rebate_export";
import search from "./search";

export default function configureRoutes(app: any) {
  app.use(
    home,
    clients,
    offers,
    rebates,
    transactions,
    transaction_import,
    rebate_export,
    search
  );
}
