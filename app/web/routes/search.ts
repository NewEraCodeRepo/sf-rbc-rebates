import { app } from "./support";
import { UserRepository } from "../../database/repositories/user_repository";
import { IOrder } from "../../interfaces/search_api_options";
import * as _ from "lodash";
import { IUser } from "../../models/user";
import {RebateCriteriaRepository} from "../../database/repositories/rebate_criteria_repository";
import {IRebateCriteria} from "../../models/rebate_criteria";

  /**
   * API URL just for select2
   * ------------------------
   * https://select2.org/data-sources/ajax
   *
   * term : The current search term in the search box.
   * q : Contains the same contents as term.
   * _type: A "request type". Will usually be query, but changes to query_append for paginated requests.
   * page : The current page number to request. Only sent for paginated (infinite scrolling) searches.
   *
   * ?search=[term]&page=[page]
   *
   * ie.
   * https://api.github.com/search/repositories?term=sel&_type=query&q=sel&page=<page#>
   */
// @TODO DRY this up?
app.get("/search/client", async (request, response) => {

  const select = ["id"];
  const query = request.query.term;
  const page = request.query.page;
  const limit = 10;
  const order: IOrder = { by: "inserted_at", direction: "DESC" };
  const offset = (parseInt(page, 10) - 1) * limit;

  const paginatedUsers: IUser[] = await UserRepository.findWithPagination({select, query, offset, limit, order});
  const allUserCount = await UserRepository.count();

  const endCount = offset + limit;
  const morePages = allUserCount > endCount;

  function formatData() {
    return new Promise ((resolve, reject) => {
      const selectTwoFormattedResult: any = {
        results: []
      };

      _.forEach(paginatedUsers, (user) => {
        if (_.has(user, 'id')) {

          const obj = {
            id: user.id,
            text: user.id
          };
          selectTwoFormattedResult.results.push(obj);
        }
      });

      const pagination = {
        more: morePages
      };

      selectTwoFormattedResult.pagination = pagination;
      resolve(selectTwoFormattedResult);
    });
  }
  const formattedData = await formatData();

  response.json(formattedData);

});

app.get("/search/offer", async (request, response) => {

  const select = ["id", "description_for_testing"];
  const query = request.query.term;
  const page = request.query.page;
  const limit = 10;
  const order: IOrder = { by: "inserted_at", direction: "DESC" };
  const offset = (parseInt(page, 10) - 1) * limit;

  const paginatedOffers: IRebateCriteria[] = await RebateCriteriaRepository
    .findWithPagination({select, query, offset, limit, order});
  const allOfferCount = await RebateCriteriaRepository.count();

  const endCount = offset + limit;
  const morePages = allOfferCount > endCount;

  function formatData() {
    return new Promise ((resolve, reject) => {
      const selectTwoFormattedResult: any = {
        results: []
      };

      _.forEach(paginatedOffers, (offer) => {
        if (_.has(offer, 'id')) {

          const obj = {
            id: offer.id,
            text: offer.descriptionForTesting || `Offer ${offer.id}`
          };
          selectTwoFormattedResult.results.push(obj);
        }
      });

      const pagination = {
        more: morePages
      };

      selectTwoFormattedResult.pagination = pagination;
      resolve(selectTwoFormattedResult);
    });
  }
  const formattedData = await formatData();

  response.json(formattedData);

});

export default app;
