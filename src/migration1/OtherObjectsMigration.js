import { StatSnapshotOld } from '../models-old/StatsModel';
import { createStatSnapshot } from '../models/StatsModel';
import { createMatchObject } from '../models/MatchModel';
import { MatchOld } from '../models-old/MatchModel';
import { createDiscoveryQueueObject } from '../models/DiscoveryQueueModel';
import { DiscoveryQueueOld } from '../models-old/DiscoveryQueueModel';

const debug = require('debug')('dev:MigrateOtherObjects');

const migrateStatSnapshot = async (statSnapshot) => {
  const statSnapshotObj = statSnapshot.toObject();
  return createStatSnapshot(statSnapshotObj, true);
};

export const migrateStatSnapshots = async () => {
  const migrateStatSnapshotPromises = [];
  let count = 0;
  return new Promise((resolve, reject) => {
    StatSnapshotOld.find({})
      .cursor()
      .on('data', (statSnapshot) => {
        migrateStatSnapshotPromises
          .push(migrateStatSnapshot(statSnapshot)
            .then((doc) => {
              if (!doc) {
                debug('doc not found');
                debug(`stat snapshot id is ${doc._id}`);
              } else {
                count += 1;
                debug(`${count} migrated so far: migrated ${doc.createdAt}`);
              }
            }));
      })
      .on('end', async () => {
        Promise.all(migrateStatSnapshotPromises)
          .then(() => {
            debug('Finished migrating stat snapshots');
            resolve();
          })
          .catch((err) => {
            debug(`error with migrating stat snapshots: ${err}`);
            reject(err);
          });
      });
  });
};

const migrateMatch = async (match) => {
  const matchObj = match.toObject();
  return createMatchObject(matchObj, true);
};

export const migrateMatches = async () => {
  const migrateMatchesPromises = [];
  let count = 0;
  return new Promise((resolve, reject) => {
    MatchOld.find({})
      .cursor()
      .on('data', (match) => {
        migrateMatchesPromises
          .push(migrateMatch(match)
            .then((doc) => {
              if (!doc) {
                debug('doc not found');
                debug(`match id is ${doc._id}`);
              } else {
                count += 1;
                debug(`${count} migrated so far: migrated ${doc._id}`);
              }
            }));
      })
      .on('end', async () => {
        Promise.all(migrateMatchesPromises)
          .then(() => {
            debug('Finished migrating matches');
            resolve();
          })
          .catch((err) => {
            debug(`error with migrating matches: ${err}`);
            reject(err);
          });
      });
  });
};

const migrateDiscoveryQueue = async (discoveryQueue) => {
  const discoveryQueueObj = discoveryQueue.toObject();
  return createDiscoveryQueueObject(discoveryQueueObj, true);
};

export const migrateDiscoveryQueues = async () => {
  const migrateDiscoveryQueuePromises = [];
  let count = 0;
  return new Promise((resolve, reject) => {
    DiscoveryQueueOld.find({})
      .cursor()
      .on('data', (discoveryQueue) => {
        migrateDiscoveryQueuePromises
          .push(migrateDiscoveryQueue(discoveryQueue)
            .then((doc) => {
              if (!doc) {
                debug('doc not found');
                debug(`DQ user id is ${doc.user_id}`);
              } else {
                count += 1;
                debug(`${count} migrated so far: migrated ${doc._id}`);
              }
            }));
      })
      .on('end', async () => {
        Promise.all(migrateDiscoveryQueuePromises)
          .then(() => {
            debug('Finished migrating discovery queues');
            resolve();
          })
          .catch((err) => {
            debug(`error with migrating discovery queues: ${err}`);
            reject(err);
          });
      });
  });
};
