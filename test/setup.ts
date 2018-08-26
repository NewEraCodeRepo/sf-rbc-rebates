import * as seedRandom from "seed-random";
import * as env from "env-var";
import * as faker from "faker";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { ILoggable } from "../app/interfaces/loggable";

// Extend Chai with assertions for promises
chai.use(chaiAsPromised);

// Seed random data
const MAX_RANDOM_VALUE = 10000;
const RANDOM_SEED = Math.round(Math.random() * MAX_RANDOM_VALUE).toString();

const seed = env.get('SEED', RANDOM_SEED).asInt();
const logger: ILoggable = console;

// Seed Math.random and friends
seedRandom(seed, { global: true });

// Seed Faker's randomisation
faker.seed(seed);

logger.info('Reproduce these test results with --seed', seed);
