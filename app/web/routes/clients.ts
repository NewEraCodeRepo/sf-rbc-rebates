import { RebateCriteriaRepository } from "../../database/repositories/rebate_criteria_repository";
import { UserRepository } from "../../database/repositories/user_repository";
import { UserLedgerRepository } from "../../database/repositories/user_ledger_repository";
import { IUser } from "../../models/user";
import { app, viewContext } from "./support";
import {UserLedgerSerializer} from "../../database/serializers/user_ledger_serializer";
import {IRebateCriteria} from "../../models/rebate_criteria";
import * as _ from "lodash";

app.get("/clients", async (request, response) => {
    const users = await UserRepository.findAll({
        take: 500,
        order: { inserted_at: 'DESC' }
    });

    response.render("clients/index", viewContext({
        users,
        title: "Clients",
    }));
});

app.get("/clients/new", async (request, response) => {
    const rebateCriterias = await RebateCriteriaRepository.findAll();

    response.render("clients/new", viewContext({
        rebateCriterias,
        title: "New client" }));
});

app.get("/clients/edit/:id", async (request, response) => {

  const rebateCriterias: IRebateCriteria[] = await RebateCriteriaRepository.findAll();
  const allOfferIds = rebateCriterias.map((offer) => offer.id);

  const userViewData = {
    allOfferIds,
    userId: request.params.id
  };

  response.render("clients/edit", viewContext({
    userViewData,
    title: "Edit Offers for Client" }));
});

app.post("/clients/edit", async (request, response) => {

  const userId = request.body.userId;

  const user: IUser = await UserRepository.findOrFail(userId);

  if (typeof request.body.linkedOfferIds === 'string') {
    request.body.linkedOfferIds = [request.body.linkedOfferIds];
  }

  if (typeof request.body.targetedOfferIds === 'string') {
    request.body.targetedOfferIds = [request.body.targetedOfferIds];
  }

  const updatedUser: IUser = {
    id: userId,
    linkedOfferIds: _.has(request, 'body.linkedOfferIds') ? request.body.linkedOfferIds : [],
    targetedOfferIds: _.has(request, 'body.targetedOfferIds') ? request.body.targetedOfferIds : [],
    optInFileOffers: _.has(request, 'body.optedInOffers') ? request.body.optedInOffers : [],
    isEnrolled: user.isEnrolled,
    isBlacklisted: Boolean(request.body.isBlacklisted),
    creditCardProducts: [],
    debitCardProducts: []
  };

  // Update user information into ledger
  const ledgerUserRecord = UserLedgerSerializer.deserialize({
    user_id: userId,
    update_timestamp: new Date().toUTCString(),
    user_info: {
      targeted_offers: request.body.targetedOfferIds,
      linked_offers: request.body.linkedOfferIds,
      is_enrolled: user.isEnrolled
    }
  });

  // can't use update method
  await UserRepository.insert(updatedUser);
  await UserLedgerRepository.insert(ledgerUserRecord);

  response.redirect("/clients");
});

app.post("/clients", async (request, response) => {
    const user: IUser = {
        id: request.body.userId,
        linkedOfferIds: request.body.linkedOfferIds,
        targetedOfferIds: request.body.targetedOfferIds,
        optInFileOffers: _.has(request, 'body.optedInOffers') ? request.body.optedInOffers : [],
        isEnrolled: Boolean(request.body.isEnrolled),
        isBlacklisted: Boolean(request.body.isBlacklisted),
        creditCardProducts: [],
        debitCardProducts: []
    };

    if (typeof request.body.linkedOfferIds === 'string') {
      user.linkedOfferIds = [request.body.linkedOfferIds];
    }

    if (typeof request.body.targetedOfferIds === 'string') {
      user.targetedOfferIds = [request.body.targetedOfferIds];
    }

    // Add user information into ledger
    const ledgerUserRecord = UserLedgerSerializer.deserialize({
      user_id: user.id,
      update_timestamp: new Date().toUTCString(),
      user_info: {
        targeted_offers: user.targetedOfferIds,
        linked_offers: user.linkedOfferIds,
        is_enrolled: user.isEnrolled
      }
    });

    await UserLedgerRepository.insert(ledgerUserRecord);
    await UserRepository.insert(user);

    response.redirect("/clients");
});

app.post("/clients/delete-all", async (request, response) => {
  await UserRepository.truncate();
  await UserLedgerRepository.truncate();
  response.redirect("/clients");
});

/**
 * PRODUCTS
 */

app.get("/clients/products/:userId", async (request, response) => {
  const userId = request.params.userId;

  const user: IUser = await UserRepository.findOrFail(userId);

  response.render("clients/products", viewContext({
    user,
    title: "User Products" }));
});

/**
 * OPT-INS
 */

app.get("/clients/optins/:userId", async (request, response) => {
    const userId = request.params.userId;

    const user: IUser = await UserRepository.findOrFail(userId);

    response.render("clients/optins", viewContext({
        user,
        title: "User Opt-Ins" }));
});

/**
 * CLIENT HISTORY
 */

app.get("/clients/history/:id", async (request, response) => {

  const usersHistory = await UserLedgerRepository.findAll({user_id: request.params.id});

  usersHistory.forEach((user: any) => user.isoDate = user.updateTimestamp.toISOString());

  const userHistory = _.orderBy(usersHistory, ['updateTimestamp'], ['desc']);

  response.render("clients/history", viewContext({
    userHistory,
    title: "User History Record" }));
});

app.get("/clients/edit_history/id/:id/timestamp/:updateTimestamp", async (request, response) => {

  const user: any = await UserLedgerRepository
    .findUserLedgerRecord({user_id: request.params.id, update_timestamp: request.params.updateTimestamp});

  user.isoDate = request.params.updateTimestamp;

  response.render("clients/edit_history", viewContext({
    user,
    title: `Edit Updated Timestamp  ${user.updateTimestamp} for ${user.userId}` }));
});

app.post("/clients/edit_history", async (request, response) => {
  const newUpdateTimestamp = new Date(request.body.newTimestamp).toUTCString();

  await UserLedgerRepository.updateUserLedgerRecord({
    user_id: request.body.userId,
    update_timestamp: request.body.isoDate,
    data: {
      updateTimestamp: newUpdateTimestamp
    }
  });

  response.redirect(`/clients/history/${request.body.userId}`);
});

app.post("/clients/history/delete-all/:id", async (request, response) => {

  await UserLedgerRepository.deleteAllUsersHistory({ user_id: request.params.id });

  response.redirect("/clients");
});

export default app;
