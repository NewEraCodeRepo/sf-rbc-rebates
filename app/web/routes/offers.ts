import { RebateCriteriaRepository } from "../../database/repositories/rebate_criteria_repository";
import { IRebateCriteria } from "../../models/rebate_criteria";
import randomDemoId from "../util/random_demo_id";
import { app, viewContext } from "./support";
import { RebateRepository } from "../../database/repositories/rebate_repository";
import { RewardCalculationInterpretation } from "../../offer_import/reward_calculation_interpretation";
import { OfferBenefitToCustomer } from "../../interfaces/offer_benefit_to_customer";

app.get("/offers", async (request, response) => {
  let rebateCriterias = await RebateCriteriaRepository.findAll({
    order: { inserted_at: 'DESC' }
  });

  rebateCriterias = await Promise.all(rebateCriterias.map(async (criteria) => {
    const count = await RebateRepository.totalRedeemedCount(criteria.id);
    const amount = await RebateRepository.totalRedeemedSum(criteria.id);
    return Object.assign({}, criteria, {count, amount });
  }));

  response.render("offers/index", viewContext({
    rebateCriterias,
    title: "Offers",
  }));
});

app.get("/offers/new", (request, response) => {

  response.render("offers/new", viewContext({
    title: "New offer",
    benefitToCustomerOptions: Object.values(OfferBenefitToCustomer)
  }));

});

app.post("/offers", async (request, response) => {
    const rewardCalculation = RewardCalculationInterpretation.from({
      benefitToCustomer: request.body.benefitToCustomer,
      rebateAmount: request.body.rebateAmount
    });

    const criteria: IRebateCriteria = {
        id: request.body.offerIdForTesting === "" ? randomDemoId({ prefix: 'O' }) : request.body.offerIdForTesting,
        descriptionForTesting: request.body.descriptionForTesting,
        isRedeemable: Boolean(request.body.isRedeemable),
        merchantId: request.body.merchantId,
        refundPeriodInDays: request.body.refundPeriodInDays,
        rewardCalculation,
        validFromDate: request.body.validFromDate,
        validToDate: request.body.validToDate,
        hasBeenActivated: Boolean(request.body.hasBeenActivated),
        requiresCustomerToBeLinked: Boolean(request.body.requiresCustomerToBeLinked),
        requiresCustomerToBeTargeted: Boolean(request.body.requiresCustomerToBeTargeted),
        redemptionLimit: Number(request.body.redemptionLimit),
        redemptionLimitType: request.body.redemptionLimitType,
        redemptionPeriodInDays: request.body.redemptionPeriodInDays,
        eligibleProducts: request.body.eligibleProducts,
        redemptionBasedOn: request.body.redemptionBasedOn
    };

    await RebateCriteriaRepository.insert(criteria);

    response.redirect("/offers");
});

app.post("/offers/delete-all", async (request, response) => {
  await RebateCriteriaRepository.truncate();
  response.redirect("/offers");
});

/**
 * PRODUCTS
 */

app.get("/offers/products/:id", async (request, response) => {
  const offer = await RebateCriteriaRepository.findOrFail(request.params.id);

  response.render("offers/products", viewContext({
    offer,
    title: "Offer Products" }));
});

export default app;
