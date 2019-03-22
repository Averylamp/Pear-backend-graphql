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

const debug = require('debug')('dev:tests:RunTests');
const testLog = require('debug')('dev:tests:Test');
const verboseDebug = require('debug')('dev:tests:verbose:RunTests');
const errorLog = require('debug')('error:RunTests');
const mongoose = require('mongoose');

const verbose = process.env.VERBOSE ? process.env.VERBOSE : false;

const checkForAndLogErrors = (result, keyName) => {
  if (result.data && result.data[keyName]
    && !result.data[keyName].success) {
    errorLog(
      `Error sending matchmaker match request: ${result.data[keyName].message}`,
    );
  } else if (result.errors) {
    errorLog(`Error: ${result.errors}`);
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
          debug(`Failed to drop db ${err}`);
          process.exit(1);
        });

      const { mutate } = createTestClient(apolloServer);

      // CREATE USERS
      testLog('TESTING: Create Users');
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
              errorLog(`Error Creating User: ${result.data.createUser.message}`);
              process.exit(1);
            }
          });
          return results;
        })
        .catch((err) => {
          errorLog(err);
          process.exit(1);
        });

      if (verbose) createUserResults.forEach((result) => { verboseDebug(result); });
      testLog('***** Success Creating Users *****\n');


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
          errorLog(err);
          process.exit(1);
        });
      if (verbose) uploadImagesResults.forEach((result) => { verboseDebug(result); });
      testLog('***** Success Uploading Images *****\n');
      let imageCount = 0;
      let imageErrorCount = 0;
      uploadImagesResults.forEach((result) => {
        imageCount += result.length;
        result.forEach((imageResult) => {
          if (!imageResult.imageID) {
            errorLog('Image not uploaded properly');
            errorLog(imageResult);
            imageErrorCount += 1;
          }
        });
      });
      debug(`Finished Uploading ${imageCount} Images in ${process.hrtime(timerStart)[0]}s`);
      if (imageErrorCount > 0) {
        errorLog(`ERROR UPLOADING ${imageErrorCount} Images`);
        process.exit(1);
      }

      // CREATE DETACHED PROFILES
      testLog('TESTING: Creating Detached Profiles');
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
                errorLog(
                  `Error Creating Detached Profile: ${result.data.createDetachedProfile.message}`,
                );
                process.exit(1);
              }
            } catch (e) {
              errorLog('Error Printing out Results:');
              errorLog(result);
              errorLog(e);
              process.exit(1);
            }
          });
          return results;
        })
        .catch((err) => {
          errorLog(err);
          process.exit(1);
        });
      if (verbose) createDetachedProfileResults.forEach((result) => { verboseDebug(result); });
      testLog('***** Success Creating Detached Profiles *****\n');

      // ATTACH DETACHED PROFILES
      testLog('TESTING: Attaching Detached Profiles');
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
                errorLog(
                  `Error Creating Detached Profile: ${result.data.approveNewDetachedProfile.message}`,
                );
                process.exit(1);
              }
            } catch (e) {
              errorLog('Error Printing out Results');
              errorLog(e);
              process.exit(1);
            }
          });
          return results;
        })
        .catch((err) => {
          errorLog(err);
          process.exit(1);
        });
      if (verbose) attachProfileResults.forEach((result) => { verboseDebug(result); });
      testLog('***** Success Attaching Detached Profiles *****\n');

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

      testLog('TESTING: Sending Match Requests');
      for (const sendPersonalRequestVars of sendPersonalRequests) {
        try {
          const result = await mutate(({
            mutation: PERSONAL_SEND_REQUEST,
            variables: sendPersonalRequestVars,
          }));
          checkForAndLogErrors(result, 'personalCreateRequest');
        } catch (e) {
          errorLog(`Error: ${e.toString()}`);
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
          errorLog(`Error: ${e.toString()}`);
        }
      }

      testLog('TESTING: Viewing Match Requests');
      for (const viewRequestVars of viewRequests) {
        try {
          const result = await mutate(({
            mutation: VIEW_REQUEST,
            variables: viewRequestVars,
          }));
          checkForAndLogErrors(result, 'viewRequest');
        } catch (e) {
          errorLog(`Error: ${e.toString()}`);
        }
      }

      testLog('TESTING: Accepting Match Requests');
      for (const acceptRequestVars of acceptRequests) {
        try {
          const result = await mutate(({
            mutation: ACCEPT_REQUEST,
            variables: acceptRequestVars,
          }));
          checkForAndLogErrors(result, 'acceptRequest');
        } catch (e) {
          errorLog(`Error: ${e.toString()}`);
        }
      }

      testLog('TESTING: Rejecting Match Requests');
      for (const rejectRequestVars of rejectRequests) {
        try {
          const result = await mutate(({
            mutation: REJECT_REQUEST,
            variables: rejectRequestVars,
          }));
          checkForAndLogErrors(result, 'rejectRequest');
        } catch (e) {
          errorLog(`Error: ${e.toString()}`);
        }
      }

      testLog('TESTING: Unmatching');
      for (const unmatchVars of unmatches) {
        try {
          const result = await mutate(({
            mutation: UNMATCH,
            variables: unmatchVars,
          }));
          checkForAndLogErrors(result, 'unmatch');
        } catch (e) {
          errorLog(`Error: ${e.toString()}`);
        }
      }
      testLog('***** Success Performing Match Operations *****\n');

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
