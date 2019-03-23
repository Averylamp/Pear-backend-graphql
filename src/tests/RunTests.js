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
  MATCHMAKER_SEND_REQUEST,
  PERSONAL_SEND_REQUEST,
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
const testLog = require('debug')('dev:tests:Test');
const verboseDebug = require('debug')('dev:tests:verbose:RunTests');
const errorLog = require('debug')('error:RunTests');
const mongoose = require('mongoose');

const verbose = process.env.VERBOSE ? process.env.VERBOSE : false;
const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const checkForAndLogErrors = (result, keyName) => {
  if (result.data && result.data[keyName]
    && !result.data[keyName].success) {
    errorLog(errorStyling(
      `Error sending matchmaker match request: ${result.data[keyName].message}`,
    ));
  } else if (result.errors) {
    errorLog(errorStyling(`Error: ${result}`));
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
      errorLog(errorStyling('Failed to connect to mongo'));
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
          errorLog(errorStyling(`Failed to drop db ${err}`));
          process.exit(1);
        });

      const { mutate } = createTestClient(apolloServer);

      // CREATE USERS
      testLog(testCaseStyling('TESTING: Create Users'));
      const createUserPromises = [];
      for (const userVars of createUsers) {
        createUserPromises.push(mutate({
          mutation: CREATE_USER,
          variables: userVars,
        }));
      }
      const createUserResults = await Promise.all(createUserPromises)
        .then((results) => {
          results.forEach((result) => {
            if (!result.data.createUser.success) {
              errorLog(errorStyling(`Error Creating User: ${result.data.createUser.message}`));
              process.exit(1);
            }
          });
          return results;
        })
        .catch((err) => {
          errorLog(errorStyling(`${err}`));
          process.exit(1);
        });

      if (verbose) createUserResults.forEach((result) => { verboseDebug(result); });
      testLog(successStyling('***** Success Creating Users *****\n'));


      // UPLOAD DETACHED PROFILE IMAGES
      testLog(testCaseStyling('TESTING: Uploading Images'));

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
          errorLog(errorStyling(`${err}`));
          process.exit(1);
        });
      if (verbose) uploadImagesResults.forEach((result) => { verboseDebug(result); });
      testLog(successStyling('***** Success Uploading Images *****\n'));
      let imageCount = 0;
      let imageErrorCount = 0;
      uploadImagesResults.forEach((result) => {
        imageCount += result.length;
        result.forEach((imageResult) => {
          if (!imageResult.imageID) {
            errorLog(errorStyling('Image not uploaded properly'));
            errorLog(errorStyling(`${imageResult}`));
            imageErrorCount += 1;
          }
        });
      });
      debug(`Finished Uploading ${imageCount} Images in ${process.hrtime(timerStart)[0]}s`);
      if (imageErrorCount > 0) {
        errorLog(errorStyling(`ERROR UPLOADING ${imageErrorCount} Images`));
        process.exit(1);
      }

      // CREATE DETACHED PROFILES
      testLog(testCaseStyling('TESTING: Creating Detached Profiles'));
      const createDetachedProfilePromises = [];
      for (let i = 0; i < createDetachedProfiles.length; i += 1) {
        const detachedProfileVars = createDetachedProfiles[i];
        detachedProfileVars.detachedProfileInput.images = uploadImagesResults[i];
        createDetachedProfilePromises.push(mutate({
          mutation: CREATE_DETACHED_PROFILE,
          variables: detachedProfileVars,
        }));
      }
      const createDetachedProfileResults = await Promise.all(createDetachedProfilePromises)
        .then((results) => {
          results.forEach((result) => {
            try {
              if (!result.data.createDetachedProfile.success) {
                errorLog(errorStyling(
                  `Error Creating Detached Profile: ${result.data.createDetachedProfile.message}`,
                ));
                process.exit(1);
              }
            } catch (e) {
              errorLog(errorStyling('Error Printing out Results:'));
              errorLog(errorStyling(`${result}`));
              errorLog(errorStyling(`${e}`));
              process.exit(1);
            }
          });
          return results;
        })
        .catch((err) => {
          errorLog(errorStyling(`${err}`));
          process.exit(1);
        });
      if (verbose) createDetachedProfileResults.forEach((result) => { verboseDebug(result); });
      testLog(successStyling('***** Success Creating Detached Profiles *****\n'));

      // ATTACH DETACHED PROFILES
      testLog(testCaseStyling('TESTING: Attaching Detached Profiles'));
      const attachProfilePromises = [];
      for (const attachProfileVars of attachProfiles) {
        attachProfilePromises.push(mutate({
          mutation: ATTACH_DETACHED_PROFILE,
          variables: attachProfileVars,
        }));
      }
      const attachProfileResults = await Promise.all(attachProfilePromises)
        .then((results) => {
          results.forEach((result) => {
            try {
              if (!result.data.approveNewDetachedProfile.success) {
                errorLog(errorStyling(
                  `Error Creating Detached Profile: ${result.data.approveNewDetachedProfile.message}`,
                ));
                process.exit(1);
              }
            } catch (e) {
              errorLog(errorStyling('Error Printing out Results'));
              errorLog(errorStyling(`${e}`));
              process.exit(1);
            }
          });
          return results;
        })
        .catch((err) => {
          errorLog(errorStyling(`${err}`));
          process.exit(1);
        });
      if (verbose) attachProfileResults.forEach((result) => { verboseDebug(result); });
      testLog(successStyling('***** Success Attaching Detached Profiles *****\n'));

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

      testLog(testCaseStyling('TESTING: Generating Discovery Items'));
      const discoveryIterations = 4;
      testLog(testCaseStyling(`ROUNDS: ${discoveryIterations}`));
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
                errorLog(errorStyling(`Error Updating Discovery: ${result}`));
                process.exit(1);
              }
            });
          });
        if (verbose) discoveryResults.forEach(result => verboseDebug(result));
        testLog(successStyling(`* Successful Discovery Round ${i + 1} *\n`));
      }
      testLog(successStyling('***** Success Generating Discovery Items *****\n'));


      testLog(testCaseStyling('TESTING: Sending Match Requests'));
      for (const sendPersonalRequestVars of sendPersonalRequests) {
        try {
          const result = await mutate(({
            mutation: PERSONAL_SEND_REQUEST,
            variables: sendPersonalRequestVars,
          }));
          checkForAndLogErrors(result, 'personalCreateRequest');
        } catch (e) {
          errorLog(errorStyling(`Error: ${e.toString()}`));
        }
      }
      for (const sendMatchmakerRequestVars of sendMatchmakerRequests) {
        try {
          const result = await mutate(({
            mutation: MATCHMAKER_SEND_REQUEST,
            variables: sendMatchmakerRequestVars,
          }));
          checkForAndLogErrors(result, 'matchmakerCreateRequest');
        } catch (e) {
          errorLog(errorStyling(`Error: ${e.toString()}`));
        }
      }
      testLog(successStyling('***** Success Sending Match Requests *****\n'));


      testLog(testCaseStyling('TESTING: Viewing Match Requests'));
      for (const viewRequestVars of viewRequests) {
        try {
          const result = await mutate(({
            mutation: VIEW_REQUEST,
            variables: viewRequestVars,
          }));
          checkForAndLogErrors(result, 'viewRequest');
        } catch (e) {
          errorLog(errorStyling(`Error: ${e.toString()}`));
        }
      }
      testLog(successStyling('***** Success Viewing Match Requests *****\n'));

      testLog(testCaseStyling('TESTING: Accepting Match Requests'));
      for (const acceptRequestVars of acceptRequests) {
        try {
          const result = await mutate(({
            mutation: ACCEPT_REQUEST,
            variables: acceptRequestVars,
          }));
          checkForAndLogErrors(result, 'acceptRequest');
        } catch (e) {
          errorLog(errorStyling(`Error: ${e.toString()}`));
        }
      }
      testLog(successStyling('***** Success Accepting Match Requests *****\n'));

      testLog(testCaseStyling('TESTING: Rejecting Match Requests'));
      for (const rejectRequestVars of rejectRequests) {
        try {
          const result = await mutate(({
            mutation: REJECT_REQUEST,
            variables: rejectRequestVars,
          }));
          checkForAndLogErrors(result, 'rejectRequest');
        } catch (e) {
          errorLog(errorStyling(`Error: ${e.toString()}`));
        }
      }
      testLog(successStyling('***** Success Rejecting Match Requests *****\n'));

      testLog(testCaseStyling('TESTING: Unmatching'));
      for (const unmatchVars of unmatches) {
        try {
          const result = await mutate(({
            mutation: UNMATCH,
            variables: unmatchVars,
          }));
          checkForAndLogErrors(result, 'unmatch');
        } catch (e) {
          errorLog(errorStyling(`Error: ${e.toString()}`));
        }
      }
      testLog(successStyling('***** Success Unmatching *****\n'));


      const line = '****************************************\n';
      const passed = '*********** All Tests Passed ***********\n';
      testLog(successStyling(line + passed + line));

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
