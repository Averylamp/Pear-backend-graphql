import { migrateUsers } from './UserMigration';
import { migrateDetachedProfiles } from './DetachedProfileMigration';
import {
  migrateDiscoveryQueues,
  migrateMatches,
  migrateStatSnapshots,
} from './OtherObjectsMigration';

const debug = require('debug')('dev:Migration1');

export const runMigration = async () => {
  await migrateUsers();
  await migrateDetachedProfiles();
  await migrateMatches();
  await migrateDiscoveryQueues();
  await migrateStatSnapshots();
  debug('migration complete');
  setTimeout(() => {
    process.exit(0);
  }, 2000);
};
