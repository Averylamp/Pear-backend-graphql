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
  acceptRequests,
  rejectRequests,
  unmatches,
  updateFeeds,
  viewDetachedProfiles,
  updateUsers,
  editUserProfiles,
  editDetachedProfiles, addQuestions, updateUserFirstNames,
} from './CreateTestDB';
import {
  ACCEPT_REQUEST,
  ATTACH_DETACHED_PROFILE,
  CREATE_DETACHED_PROFILE,
  CREATE_USER,
  CREATE_MATCH_REQUEST,
  REJECT_REQUEST,
  UNMATCH,
  FORCE_FEED_UPDATE,
  VIEW_DETACHED_PROFILE,
  UPDATE_DISPLAYED_PHOTOS,
  UPDATE_USER,
  EDIT_USER_PROFILE,
  EDIT_DETACHED_PROFILE, ADD_QUESTIONS,
} from './Mutations';
import {
  MONGO_URL,
  apolloServer,
} from '../start';
import { deleteChatsCollection, sendMessage } from '../FirebaseManager';
import { Match } from '../models/MatchModel';


const debug = require('debug')('tests:RunTests');
const testLogger = require('debug')('tests:Test');
const verboseDebug = require('debug')('tests:verbose:RunTests');
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
    errorLog(`Error with request ${keyName}: ${result.errors}`);
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

      testLog('Clearing all previous firebase chat objects');
      await deleteChatsCollection();
      testLog('Cleared all previous firebase chat objects');

      const { mutate } = createTestClient(apolloServer);

      // ADD QUESTIONS
      testLog('TESTING: Add Questions');
      try {
        const result = await mutate({
          mutation: ADD_QUESTIONS,
          variables: addQuestions,
        });
        if (verbose) {
          verboseDebug(result);
        }
      } catch (e) {
        errorLog(`${e}`);
        process.exit(1);
      }
      successLog('***** Success Adding Questions *****\n');

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


      /*
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
            errorLog('Image not uploaded properly');
            errorLog(imageResult);
            imageErrorCount += 1;
          }
        });
      });
      debug(`Finished Uploading ${imageCount} Images in ${process.hrtime(timerStart)[0]}s`);
      if (imageErrorCount > 0) {
        errorLog((`ERROR UPLOADING ${imageErrorCount} Images`));
        process.exit(1);
      }
      */

      // CREATE DETACHED PROFILES
      testLog('TESTING: Creating Detached Profiles');
      const detachedProfiles = [];
      for (let i = 0; i < createDetachedProfiles.length; i += 1) {
        const detachedProfileVars = createDetachedProfiles[i];
        //  detachedProfileVars.detachedProfileInput.images = uploadImagesResults[i];
        detachedProfiles.push(detachedProfileVars.detachedProfileInput);
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

      // UPDATE USERS' FIRST NAMES
      testLog('TESTING: Updating User First Names');
      for (const updateUserFirstNameVars of updateUserFirstNames) {
        try {
          const result = await mutate({
            mutation: UPDATE_USER,
            variables: updateUserFirstNameVars,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'updateUser');
        } catch (e) {
          errorLog((`${e}`));
          process.exit(1);
        }
      }
      successLog('***** Success Updating Users *****\n');

      /*
      // VIEW DETACHED PROFILES
      testLog('TESTING: Viewing Detached Profiles');
      for (const viewProfileVars of viewDetachedProfiles) {
        try {
          const result = await mutate({
            mutation: VIEW_DETACHED_PROFILE,
            variables: viewProfileVars,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'viewDetachedProfile');
        } catch (e) {
          errorLog((`${e}`));
          process.exit(1);
        }
      }
      successLog('***** Success Viewing Detached Profiles *****\n');
      */

      testLog('TESTING: Editing Detached Profiles');
      for (const editDetachedProfileVars of editDetachedProfiles) {
        try {
          const result = await mutate({
            mutation: EDIT_DETACHED_PROFILE,
            variables: editDetachedProfileVars,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'editDetachedProfile');
        } catch (e) {
          errorLog((`${e}`));
          process.exit(1);
        }
      }
      successLog('***** Success Editing Detached Profiles *****\n');

      /*
      // UPDATING USER PROFILES
      testLog('TESTING: Updating User Images');
      for (let i = 0; i < createDetachedProfiles.length; i += 1) {
        const viewProfileVars = viewDetachedProfiles[i];
        // this looping works since createDetachedProfiles, uploadImageResults, and
        // viewDetachedProfiles are parallel arrays
        try {
          const addPhotosVariables = {
            updateUserPhotosInput: {
              user_id: viewProfileVars.user_id,
              displayedImages: uploadImagesResults[i],
              additionalImages: uploadImagesResults[i],
            },
          };
          const result = await mutate({
            mutation: UPDATE_DISPLAYED_PHOTOS,
            variables: addPhotosVariables,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'updateUserPhotos');
        } catch (e) {
          errorLog((`${e}`));
          process.exit(1);
        }
      }

      successLog('***** Success Updating User Images *****\n');
      */

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

      /*
      // UPDATE USERS
      testLog('TESTING: Updating Users');
      for (const updateUserVars of updateUsers) {
        try {
          const result = await mutate({
            mutation: UPDATE_USER,
            variables: updateUserVars,
          });
          if (verbose) {
            verboseDebug(result);
          }
          checkForAndLogErrors(result, 'updateUser');
        } catch (e) {
          errorLog((`${e}`));
          process.exit(1);
        }
      }
      successLog('***** Success Updating Users *****\n');


      testLog('TESTING: Generating Discovery Items');
      let discoveryIterations = 4;
      if (process.env.DISCOVERY_GENERATION_ROUNDS
        && Number(process.env.DISCOVERY_GENERATION_ROUNDS)) {
        const rounds = Number(process.env.DISCOVERY_GENERATION_ROUNDS);
        discoveryIterations = rounds;
      }
      testLog(`ROUNDS: ${discoveryIterations}`);
      for (let i = 0; i < discoveryIterations; i += 1) {
        for (const updateFeedVars of updateFeeds) {
          try {
            const result = await mutate(({
              mutation: FORCE_FEED_UPDATE,
              variables: updateFeedVars,
            }));
            checkForAndLogErrors(result, 'forceUpdateFeed');
          } catch (e) {
            errorLog((`Error: ${e.toString()}`));
          }
        }
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
          checkForAndLogErrors(result, 'createMatchRequest');
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
          checkForAndLogErrors(result, 'createMatchRequest');
        } catch (e) {
          errorLog((`Error: ${e.toString()}`));
        }
      }
      successLog('***** Success Sending Match Requests *****\n');

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

      testLog('TESTING: Sending Chat Messages');
      const match1 = await Match.findById('5c82162afec46c84e0000000');
      const match3 = await Match.findById('5c82162afec46c84e0000003');
      await sendMessage({
        chatID: match1.firebaseChatDocumentID,
        messageType: 'USER_MESSAGE',
        content: 'Hey there!',
        sender_id: match1.receivedByUser_id.toString(),
      });
      await sendMessage({
        chatID: match3.firebaseChatDocumentID,
        messageType: 'USER_MESSAGE',
        content: 'Nice to meet you :)',
        sender_id: match3.sentForUser_id.toString(),
      });
      await sendMessage({
        chatID: match3.firebaseChatDocumentID,
        messageType: 'USER_MESSAGE',
        content: 'Cool pics uwu',
        sender_id: match3.receivedByUser_id.toString(),
      });
      await sendMessage({
        chatID: match1.firebaseChatDocumentID,
        messageType: 'USER_MESSAGE',
        content: 'wanna get boba?',
        sender_id: match1.sentForUser_id.toString(),
      });
      successLog('***** Success Sending Chats *****');

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

      testLog('TESTING: Editing user profiles');
      for (const editVars of editUserProfiles) {
        try {
          const result = await mutate(({
            mutation: EDIT_USER_PROFILE,
            variables: editVars,
          }));
          checkForAndLogErrors(result, 'editUserProfile');
        } catch (e) {
          errorLog((`Error: ${e.toString()}`));
        }
      }
      successLog('***** Success Editing User Profiles *****\n');


      const line = '****************************************\n';
      const passed = '*********** All Tests Passed ***********\n';
      successLog(line + passed + line);

      // testLog('TESTING: Deleting a user');
      // await deleteUser(SAMMI);
      // testLog('Deleted successfully');
      */

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
