
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
const verboseDebug = require('debug')('dev:tests:verbose:RunTests');
const errorLog = require('debug')('dev:tests:error:RunTests');
const mongoose = require('mongoose');

let verbose = false;
if (process.env.VERBOSE === 'true') {
  verbose = true;
}

export const runTests = async function runTests() {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
    const { connection } = mongoose;
    connection.on('error', debug.bind(console, 'MongoDB connection error:'));
    connection.once('open', async () => {
      debug('Opened Test Mongo Connection');
      debug('Clearing all previous dev-test collections...');
      const collectionDropPromises = [];
      const collectionInfos = await connection.db.listCollections()
        .toArray();
      collectionInfos.forEach((collectionInfo) => {
        debug(`dropping collection ${collectionInfo.name}`);
        collectionDropPromises.push(connection.dropCollection(collectionInfo.name)
          .then(() => {
            debug(`dropped collection ${collectionInfo.name}`);
          }));
      }); Promise.all(collectionDropPromises).catch((err) => {
        debug(`Failed to drop db ${err}`);
        process.exit(1);
      });

      const { mutate } = createTestClient(apolloServer);

      // CREATE USERS
      debug('TESTING: Create Users');
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
      debug('***** Success *****\n');

      // UPLOAD DETACHED PROFILE IMAGES
      debug('TESTING: Uploading Images');
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
      debug('***** Success *****\n');

      // CREATE DETACHED PROFILES
      debug('TESTING: Creating Detached Profiles');
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
      debug('***** Success *****\n');

      // ATTACH DETACHED PROFILES
      debug('TESTING: Attaching Detached Profiles');
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
      debug('***** Success *****\n');

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
