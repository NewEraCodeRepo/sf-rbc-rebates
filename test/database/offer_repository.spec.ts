import offer from '../fixtures/offer';
import { OfferRepository } from '../../app/database/repositories/offer_repository';
import { includeRepositoryTests } from "./shared_repository_tests";

describe('OfferRepository', () => {
  includeRepositoryTests(OfferRepository, offer);
});
