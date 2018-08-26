import environment from "./environment";
import { verifyEngineCompatibility } from './compatibility';
import { createConnections } from 'typeorm';
import { Config } from '../app/config';

const config = new Config();
const logger = config.logger;

let booted: Promise<void>;

export default async function boot() {
  booted = booted || start();
  return booted;
}

async function start() {
  await dieOnErrors(async () => {
    verifyEngineCompatibility();
    await establishDatabaseConnection();
  });
}

async function dieOnErrors(callback) {
  try {
    await callback();
  } catch (error) {
    logger.error('Failed to boot.', error.toString());
    process.exit(1);
  }
}

async function establishDatabaseConnection() {
  await createConnections([{
      name: 'default',
      type: 'postgres',
      url: environment.database.url,
      entities: [__dirname + '/../app/database/records/*'],
      logging: environment.database.logging,
      extra: { max: 5, min: 1 }
    },
    {
       name: 'heroku_connect',
       type: 'postgres',
       url: environment.database.herokuConnectUrl,
       entities: [__dirname + '/../app/database/salesforce_records/*'],
       logging: environment.database.logging,
       extra: { max: 5, min: 1 }
    },
    {
      name: 'history',
      type: 'postgres',
      url: environment.database.historyUrl,
      entities: [__dirname + '/../app/database/history_records/*'],
      logging: environment.database.logging,
      extra: { max: 5, min: 1 }
   }
  ]);
}
