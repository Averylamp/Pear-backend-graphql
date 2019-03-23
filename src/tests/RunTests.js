import { createTestClient } from 'apollo-server-testing';
import {
  uploadImagesFromFolder,
} from './ImageUploads';
import {
  createUsers,
  createDetachedProfiles,
  attachProfiles,
  sendPersonalRequests,
  sendMatchmakerRequests,
  viewRequests,
  acceptRequests,
  rejectRequests, unmatches,
} from './CreateTestDB';
import {
  ACCEPT_REQUEST,
  ATTACH_DETACHED_PROFILE,
  CREATE_DETACHED_PROFILE,
  CREATE_USER,
  CREATE_MATCH_REQUEST,
  REJECT_REQUEST,
  UNMATCH,
  VIEW_REQUEST,
} from './Mutations';
import {
  MONGO_URL,
  apolloServer,
} from '../start';
import {
  updateDiscoveryForUserById,
} from '../discovery/DiscoverProfile';


const debug = require('debug')('dev:tests:RunTests');
const testLogger = require('debug')('dev:tests:Test');
const verboseDebug = require('debug')('dev:tests:verbose:RunTests');
const errorLogger = require('debug')('error:RunTests');
const mongoose = require('mongoose');

const verbose = process.env.VERBOSE ? process.env.VERBOSE : false;
const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

const checkForAndLogErrors = (result, keyName) => {
  if (result.data && result.data[keyName]
    && !result.data[keyName].success) {
    errorLog(
      `Error performing action ${keyName}: ${result.data[keyName].message}`,
    );
  } else if (result.errors) {
    errorLog(`Error with request ${keyName}: ${result.toString()}`);
  }
};

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
      testLog('Clearing all previous dev-test collections...');
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

      const { mutate } = createTestClient(apolloServer);

      // CREATE USERS
      const createUserResults = [];
      testLog('TESTING: Create Users');
      for (const userVars of createUsers) {
        try {
          const result = await mutate({
            mutation: CREATE_USER,
            variables: userVars,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'createUser');
          createUserResults.push(result);
        } catch (e) {
          errorLog(`${e}`);
          process.exit(1);
        }
      }
      successLog('***** Success Creating Users *****\n');


      // UPLOAD DETACHED PROFILE IMAGES
      testLog('TESTING: Uploading Images');

      const uploadDetachedProfileImages = [];
      for (const detachedProfileVars of createDetachedProfiles) {
        const detachedProfileFirstName = detachedProfileVars
          .detachedProfileInput.firstName.toLowerCase();
        const creatorID = detachedProfileVars.detachedProfileInput.creatorUser_id;
        uploadDetachedProfileImages.push(
          uploadImagesFromFolder(detachedProfileFirstName, creatorID),
        );
      }

      const timerStart = process.hrtime();
      const uploadImagesResults = await Promise.all(uploadDetachedProfileImages)
        .catch((err) => {
          errorLog(`${err}`);
          process.exit(1);
        });
      if (verbose) uploadImagesResults.forEach((result) => { verboseDebug(result); });
      successLog('***** Success Uploading Images *****\n');
      let imageCount = 0;
      let imageErrorCount = 0;
      uploadImagesResults.forEach((result) => {
        imageCount += result.length;
        result.forEach((imageResult) => {
          if (!imageResult.imageID) {
            errorLog(('Image not uploaded properly'));
            errorLog((`${imageResult}`));
            imageErrorCount += 1;
          }
        });
      });
      debug(`Finished Uploading ${imageCount} Images in ${process.hrtime(timerStart)[0]}s`);
      if (imageErrorCount > 0) {
        errorLog((`ERROR UPLOADING ${imageErrorCount} Images`));
        process.exit(1);
      }

      // CREATE DETACHED PROFILES
      testLog('TESTING: Creating Detached Profiles');
      for (let i = 0; i < createDetachedProfiles.length; i += 1) {
        const detachedProfileVars = createDetachedProfiles[i];
        detachedProfileVars.detachedProfileInput.images = uploadImagesResults[i];
        try {
          const result = await mutate({
            mutation: CREATE_DETACHED_PROFILE,
            variables: detachedProfileVars,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'createDetachedProfile');
        } catch (e) {
          errorLog((`${e}`));
          process.exit(1);
        }
      }
      successLog('***** Success Creating Detached Profiles *****\n');

      // ATTACH DETACHED PROFILES
      testLog('TESTING: Attaching Detached Profiles');
      for (const attachProfileVars of attachProfiles) {
        try {
          const result = await mutate({
            mutation: ATTACH_DETACHED_PROFILE,
            variables: attachProfileVars,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'approveNewDetachedProfile');
        } catch (e) {
          errorLog((`${e}`));
          process.exit(1);
        }
      }
      successLog('***** Success Attaching Detached Profiles *****\n');

      // UPDATE PHOTO ENDPOINT TESTING
      // const updatePhotoPromises = [];
      // for (const updatePhotoVars of updatePhotos) {
      //   updatePhotoPromises.push(mutate({
      //     mutation: UPDATE_DISPLAYED_PHOTOS,
      //     variables: updatePhotoVars,
      //   }));
      // }
      // const updatePhotoResults = await Promise.all(updatePhotoPromises);
      // updatePhotoResults.forEach((result) => { debug(result); });

      testLog('TESTING: Generating Discovery Items');
      let discoveryIterations = 4;
      if (process.env.DISCOVERY_GENERATION_ROUNDS
        && Number(process.env.DISCOVERY_GENERATION_ROUNDS)) {
        const rounds = Number(process.env.DISCOVERY_GENERATION_ROUNDS);
        discoveryIterations = rounds;
      }
      testLog(`ROUNDS: ${discoveryIterations}`);
      for (let i = 0; i < discoveryIterations; i += 1) {
        const generateDiscoveryPromises = [];
        for (const user of createUserResults) {
          generateDiscoveryPromises.push(
            updateDiscoveryForUserById({ user_id: user.data.createUser.user._id }),
          );
        }
        const discoveryResults = await Promise.all(generateDiscoveryPromises)
          .then((results) => {
            results.forEach((result) => {
              if (!result._id) {
                errorLog((`Error Updating Discovery: ${result}`));
                process.exit(1);
              }
            });
          });
        if (verbose) discoveryResults.forEach(result => verboseDebug(result));
        successLog(`* Successful Discovery Round ${i + 1} *\n`);
      }
      successLog('***** Success Generating Discovery Items *****\n');


      testLog('TESTING: Sending Match Requests');
      for (const sendPersonalRequestVars of sendPersonalRequests) {
        try {
          const result = await mutate(({
            mutation: CREATE_MATCH_REQUEST,
            variables: sendPersonalRequestVars,
          }));
          checkForAndLogErrors(result, 'personalCreateRequest');
        } catch (e) {
          errorLog((`Error: ${e.toString()}`));
        }
      }
      for (const sendMatchmakerRequestVars of sendMatchmakerRequests) {
        try {
          const result = await mutate(({
            mutation: CREATE_MATCH_REQUEST,
            variables: sendMatchmakerRequestVars,
          }));
          checkForAndLogErrors(result, 'matchmakerCreateRequest');
        } catch (e) {
          errorLog((`Error: ${e.toString()}`));
        }
      }
      successLog('***** Success Sending Match Requests *****\n');


      testLog('TESTING: Viewing Match Requests');
      for (const viewRequestVars of viewRequests) {
        try {
          const result = await mutate(({
            mutation: VIEW_REQUEST,
            variables: viewRequestVars,
          }));
          checkForAndLogErrors(result, 'viewRequest');
        } catch (e) {
          errorLog((`Error: ${e.toString()}`));
        }
      }
      successLog('***** Success Viewing Match Requests *****\n');

      testLog('TESTING: Accepting Match Requests');
      for (const acceptRequestVars of acceptRequests) {
        try {
          const result = await mutate(({
            mutation: ACCEPT_REQUEST,
            variables: acceptRequestVars,
          }));
          checkForAndLogErrors(result, 'acceptRequest');
        } catch (e) {
          errorLog((`Error: ${e.toString()}`));
        }
      }
      successLog('***** Success Accepting Match Requests *****\n');

      testLog('TESTING: Rejecting Match Requests');
      for (const rejectRequestVars of rejectRequests) {
        try {
          const result = await mutate(({
            mutation: REJECT_REQUEST,
            variables: rejectRequestVars,
          }));
          checkForAndLogErrors(result, 'rejectRequest');
        } catch (e) {
          errorLog((`Error: ${e.toString()}`));
        }
      }
      successLog('***** Success Rejecting Match Requests *****\n');


      if (!process.env.SKIP_UNMATCHING) {
        testLog('TESTING: Unmatching');
        for (const unmatchVars of unmatches) {
          try {
            const result = await mutate(({
              mutation: UNMATCH,
              variables: unmatchVars,
            }));
            checkForAndLogErrors(result, 'unmatch');
          } catch (e) {
            errorLog((`Error: ${e.toString()}`));
          }
        }
        successLog('***** Success Unmatching *****\n');
      }


      const line = '****************************************\n';
      const passed = '*********** All Tests Passed ***********\n';
      successLog(line + passed + line);

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
