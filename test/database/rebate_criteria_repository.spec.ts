import { expect } from 'chai';
import rebateCriteria from '../fixtures/rebate_criteria';
import { RebateCriteriaRepository } from '../../app/database/repositories/rebate_criteria_repository';
import { includeRepositoryTests } from "./shared_repository_tests";

describe('RebateCriteriaRepository', () => {
  includeRepositoryTests(RebateCriteriaRepository, rebateCriteria);

  it.skip('can find all records for testing', async () => {
    await RebateCriteriaRepository.bulkInsert([
      rebateCriteria({ descriptionForTesting: null }),
      rebateCriteria({ descriptionForTesting: 'Testable' })
    ]);

    const testable = await RebateCriteriaRepository.findAllForTesting();
    expect(testable.length).to.eq(2);
    expect(testable[0].descriptionForTesting).to.eq('Testable');
  });

});
