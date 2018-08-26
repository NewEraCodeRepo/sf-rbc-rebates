import boot from '../../config/boot';
import { getConnection, getRepository } from 'typeorm';

export function requiresDatabase() {
  beforeEach(setupCleanDatabase);
}

export async function setupCleanDatabase() {
  await boot();

  const connection = getConnection();

  connection.entityMetadatas.forEach((entity) => {
    const repository = getRepository(entity.tableName);
    repository.clear();
  });

  const hcConnections = getConnection('heroku_connect');
  hcConnections.entityMetadatas.forEach((entity) => {
    const repository = getRepository('salesforce.' + entity.tableName, 'heroku_connect');
    repository.clear();
  });

}
