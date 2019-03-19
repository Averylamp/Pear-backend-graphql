
import { createTestClient } from 'apollo-server-testing';
import {
  uploadImagesFromFolder,
} from './ImageUploads';
import {
  createUsers,
  createDetachedProfiles,
  attachProfiles,
} from './CreateTestDB';
import {
  ATTACH_DETACHED_PROFILE,
  CREATE_DETACHED_PROFILE,
  CREATE_USER,
} from './Mutations';
import {
  MONGO_URL,
  apolloServer,
} from '../start';

const debug = require('debug')('dev:tests:RunTests');
const testLog = require('debug')('dev:tests:Test');
const verboseDebug = require('debug')('dev:tests:verbose:RunTests');
const errorLog = require('debug')('dev:error:RunTests');
const mongoose = require('mongoose');

const verbose = process.env.VERBOSE ? process.env.VERBOSE : false;

export const runTests = async function runTests() {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    debug(`Mongo URL: ${MONGO_URL}`);
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
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

      await Promise.all(collectionDropPromises).catch((err) => {
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
        const creatorID = detachedProfileVars.creatorUser_id;
        debug(detachedProfileFirstName);
        uploadDetachedProfileImages.push(
          uploadImagesFromFolder(detachedProfileFirstName, creatorID),
        );
      }

      const uploadImagesResults = await Promise.all(uploadDetachedProfileImages)
        .catch((err) => {
          errorLog(err);
          process.exit(1);
        });
      if (verbose) uploadImagesResults.forEach((result) => { verboseDebug(result); });
      testLog('***** Success Uploading Images *****\n');

      // CREATE DETACHED PROFILES
      testLog('TESTING: Creating Detached Profiles');
      const createDetachedProfilePromises = [];
      for (let i = 0; i < createDetachedProfiles.length; i += 1) {
        const detachedProfileVars = createDetachedProfiles[i];
        detachedProfileVars.images = uploadImagesResults[i];
        createDetachedProfilePromises.push(mutate({
          mutation: CREATE_DETACHED_PROFILE,
          variables: detachedProfileVars,
        }));
      }
      const createDetachedProfileResults = await Promise.all(createDetachedProfilePromises)
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
      process.exit(0);
    });
  } catch (e) {
    debug(e);
    process.exit(1);
  }
};
