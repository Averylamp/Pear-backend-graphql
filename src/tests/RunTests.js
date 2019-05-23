import { createTestClient } from 'apollo-server-testing';
import {
  MONGO_URL,
  apolloServer,
} from '../start';
import { deleteChatsCollection } from '../FirebaseManager';
import { runCreateDetachedProfilesTest } from './testFunctions/CreateDetachedProfilesTest';
import { runCreateUsersTest } from './testFunctions/CreateUsersTest';
import { runAddQuestionsTest } from './testFunctions/AddQuestionsTest';
import { runUpdateFirstNamesTest } from './testFunctions/UpdateFirstNamesTest';
import { runViewDetachedProfilesTest } from './testFunctions/ViewDetachedProfilesTest';
import { runEditDetachedProfilesTest } from './testFunctions/EditDetachedProfilesTest';
import { runUpdateUserImagesTest } from './testFunctions/UpdateUserImagesTest';
import { runAttachDetachedProfilesTest } from './testFunctions/AttachDetachedProfilesTest';
import { runUpdateUsersTest } from './testFunctions/UpdateUsersTest';
import { runEditEndorsementsTest } from './testFunctions/EditEndorsementsTest';
import { runSendMatchRequestsTest } from './testFunctions/SendMatchRequestsTest';
import { runAcceptMatchRequestsTest } from './testFunctions/AcceptMatchRequestsTest';
import { runRejectMatchRequestsTest } from './testFunctions/RejectMatchRequestsTest';
import { runSendChatMessagesTest } from './testFunctions/SendChatMessagesTest';
import { runUnmatchTest } from './testFunctions/UnmatchTest';
import { runDiscoveryItemDecisionsTest } from './testFunctions/DecideDiscoveryItemsTest';
import { runCreateEventsTest } from './testFunctions/CreateEventsTest';
import { runAddEventCodesTest } from './testFunctions/AddEventCodesTest';


const debug = require('debug')('tests:RunTests');
const testLogger = require('debug')('tests:Test');
const errorLogger = require('debug')('error:RunTests');
const mongoose = require('mongoose');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runTests = async function runTests() {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    debug(`Mongo URL: ${MONGO_URL}`);
    mongoose.Promise = global.Promise;
    // Fix for Mongoose Errors: https://github.com/Automattic/mongoose/issues/6890
    mongoose.set('useCreateIndex', true);
    // Fix for Mongoose Errors: https://github.com/Automattic/mongoose/issues/6880
    mongoose.set('useFindAndModify', false);
    const { connection } = mongoose;
    connection.on('error', async () => {
      debug.bind(console, 'MongoDB connection error:');
      errorLog('Failed to connect to mongo');
      process.exit(1);
    });
    connection.once('open', async () => {
      debug('Opened Test Mongo Connection');
      testLog('Clearing all previous collections...');
      const collectionDropPromises = [];
      const collectionInfos = await connection.db.listCollections()
        .toArray();
      collectionInfos.forEach((collectionInfo) => {
        debug(`dropping collection ${collectionInfo.name}`);
        collectionDropPromises.push(connection.dropCollection(collectionInfo.name)
          .then(() => {
            debug(`dropped collection ${collectionInfo.name}`);
          }));
      });

      await Promise.all(collectionDropPromises)
        .catch((err) => {
          errorLog(`Failed to drop db ${err}`);
          process.exit(1);
        });

      testLog('Clearing all previous firebase chat objects');
      await deleteChatsCollection();
      testLog('Cleared all previous firebase chat objects');

      const { mutate } = createTestClient(apolloServer);

      // ADD QUESTIONS
      await runAddQuestionsTest(mutate);

      // ADD EVENTS
      await runCreateEventsTest(mutate);

      // CREATE USERS
      await runCreateUsersTest(mutate);

      // CREATE DETACHED PROFILES
      await runCreateDetachedProfilesTest(mutate);

      // UPDATE USERS' FIRST NAMES
      await runUpdateFirstNamesTest(mutate);

      // ADD EVENT CODES FOR USERS
      await runAddEventCodesTest(mutate);

      // VIEW DETACHED PROFILES
      await runViewDetachedProfilesTest(mutate);

      // EDIT DETACHED PROFILES
      await runEditDetachedProfilesTest(mutate);

      // UPLOAD DETACHED PROFILE IMAGES AND UPDATE USER IMAGES
      await runUpdateUserImagesTest(mutate);

      // ATTACH DETACHED PROFILES
      await runAttachDetachedProfilesTest(mutate);

      // UPDATE USERS
      await runUpdateUsersTest(mutate);

      // EDIT ENDORSEMENTS
      await runEditEndorsementsTest(mutate);

      // SEND MATCH REQUESTS
      await runSendMatchRequestsTest(mutate);

      // DECIDE ON MATCH REQUESTS
      await runAcceptMatchRequestsTest(mutate);
      await runRejectMatchRequestsTest(mutate);

      // SEND CHAT MESSAGES
      await runSendChatMessagesTest();

      if (!process.env.SKIP_UNMATCHING) {
        await runUnmatchTest(mutate);
      }

      // test skip, wave, pear
      await runDiscoveryItemDecisionsTest(mutate);

      const line = '****************************************\n';
      const passed = '*********** All Tests Passed ***********\n';
      successLog(line + passed + line);

      // testLog('TESTING: Deleting a user');
      // await deleteUser(SAMMI);
      // testLog('Deleted successfully');

      // wait for any async db calls to finish
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });
  } catch (e) {
    debug(e);
    process.exit(1);
  }
};
