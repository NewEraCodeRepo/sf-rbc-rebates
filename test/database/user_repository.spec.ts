import { expect } from 'chai';
import { UserRepository } from '../../app/database/repositories/user_repository';
import { includeRepositoryTests } from "./shared_repository_tests";
import buildUser from '../fixtures/user';

describe('UserRepository', () => {
  includeRepositoryTests(UserRepository, buildUser);

  async function createUser(attributes: any = {}) {
    await UserRepository.insert(buildUser(attributes));
  }

  it("can insert and retrieve linked offer IDs", async () => {
    await createUser({ id: '1', linkedOfferIds: ['O1', 'O2'], targetedOfferIds: ['O3', 'O4'] });

    const retrieved = await UserRepository.findOrFail('1');
    expect(retrieved.linkedOfferIds).to.deep.eq(['O1', 'O2']);
  });

  it("handles empty linked offer IDs during bulk insertion", async () => {
    const user = buildUser({ id: '1', linkedOfferIds: [], targetedOfferIds: [] });
    await UserRepository.bulkInsert([user]);
  });
});
