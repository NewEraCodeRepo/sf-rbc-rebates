import { RebateRepository } from "../../database/repositories/rebate_repository";
import { app, viewContext } from "./support";
import { OfferRepository } from "../../database/repositories/offer_repository";

app.get("/rebates", async (request, response) => {
  const rebates = await RebateRepository.findAll({
    take: 500,
    order: { inserted_at: 'DESC' }
  });

  response.render("rebates/index", viewContext({
      rebates,
      title: "Rebates",
  }));
});

app.post("/rebates/sync_to_mop", async (request, response) => {
  await OfferRepository.syncTotalsToMOP();
  response.end();
});

app.post("/rebates/delete-all", async (request, response) => {
  await RebateRepository.truncate();
  response.redirect("/rebates");
});

export default app;
