import * as faker from 'faker';

export function randomEnumValue<T>(collection: any): T {
  const values = Object.values(collection);
  return faker.helpers.randomize(values) as T;
}
