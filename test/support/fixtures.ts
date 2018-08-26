import * as path from "path";
import * as fs from "fs";
import * as faker from "faker";
import { Big } from "big.js";

export function readFixtureBuffer(...relativePath) {
  return fs.readFileSync(fixturePath(...relativePath));
}

export function readFixture(...relativePath) {
  return readFixtureBuffer(...relativePath).toString();
}

export function fixturePath(...relativePath) {
  return path.join(__dirname, '..', 'fixtures', ...relativePath);
}

// Returns a date appropriate for testing. This accounts for TypeORM
// deserializing timestamp fields without millisecond information.
export function dateAppropriateForTesting(date = new Date()) {
  date.setMilliseconds(0);
  return date;
}

// Given a set of attributes and a list of date properties, ensures the dates
// safely verifiable.
export function ensureVerifiableDates(attributes, ...dateProperties: string[]) {
  dateProperties.forEach((dateProperty) => {
    if (attributes[dateProperty] instanceof Date) {
      attributes[dateProperty] = dateAppropriateForTesting(attributes[dateProperty]);
    }
  });
}

export function randomAmount(maxAmount: number = 10000) {
  const amount = new Big(faker.random.number(maxAmount * 10) / 10);
  return amount.toFixed(2);
}
