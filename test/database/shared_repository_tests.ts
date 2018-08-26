import * as chai from 'chai';
const expect = chai.expect;
import * as chaiAsPromised from 'chai-as-promised';
import chaiExclude = require('chai-exclude');
import { requiresDatabase } from '../support/database';

chai.use(chaiAsPromised);
chai.use(chaiExclude);

export function includeRepositoryTests(
  repository: any,
  fixture: (attributes?: any) => any,
  generatedIdCol: boolean = false
) {
  requiresDatabase();

  async function expectToFind(id) {
    expect(await repository.find(id)).to.not.be.undefined;
  }

  async function expectNotToFind(id) {
    expect(await repository.find(id)).to.be.undefined;
  }

  function expectEquivalentType(actual, expected) {
    expect(actual.prototype).to.eq(expected.prototype);
  }

  it(`can insert and find a model`, async () => {
    const object = fixture();

    const response = await repository.insert(object);
    const found = generatedIdCol ? await repository.find(response.id) : await repository.find(object.id);

    if (generatedIdCol) {
      expect(found).excluding('id').to.deep.eq(object);
    } else {
      expect(found).to.deep.eq(object);
    }
  });

  it.skip(`can update a model`, async () => {
    const object = fixture({ id: '42' });
    const returned = await repository.insert(object);

    expect(await repository.find('24')).to.be.undefined;
    expectEquivalentType(await repository.find('42'), object);

    await repository.update('42', { id: '24' });

    expect(await repository.find('42')).to.be.undefined;
    expectEquivalentType(await repository.find('24'), object);

    expect(returned).to.deep.eq(object);
  });

  it.skip(`can bulk insert models`, async () => {
    await repository.bulkInsert([
      fixture({ id: '1' }),
      fixture({ id: '2' }),
      fixture({ id: '3' })
    ]);

    expect(await repository.count()).to.eq(3);
  });

  it.skip(`can bulk delete models`, async () => {
    await repository.bulkInsert([
      fixture({ id: '1' }),
      fixture({ id: '2' }),
      fixture({ id: '3' }),
      fixture({ id: '4' })
    ]);

    await repository.bulkDelete(['2', '3']);

    await expectToFind('1');
    await expectNotToFind('2');
    await expectNotToFind('3');
    await expectToFind('4');
  });

  it(`can get the last model`, async () => {
    expect(repository.last()).to.be.rejected;

    const object = fixture();
    await repository.insert(object);

    expect(repository.last()).to.eventually.deep.eq(object);
  });
}
