import { createTestClient } from 'apollo-server-testing';
import {
  ATTACH_DETACHED_PROFILE,
  CREATE_DETACHED_PROFILE,
  CREATE_USER, UPDATE_DISPLAYED_PHOTOS,
} from './Mutations';
import {
  CREATE_AVERY_USER_VARIABLES, CREATE_BRIAN_USER_VARIABLES,
  CREATE_JOEL_USER_VARIABLES,
  CREATE_JOSH_USER_VARIABLES, CREATE_MADE_USER_VARIABLES,
  CREATE_SAMMI_USER_VARIABLES, CREATE_SOPHIA_USER_VARIABLES, CREATE_UMA_USER_VARIABLES,
} from './CreateUserVars';
import {
  CREATE_AVERY1_DETACHED_PROFILE_VARIABLES,
  CREATE_BRIAN1_DETACHED_PROFILE_VARIABLES,
  CREATE_JOSH1_DETACHED_PROFILE_VARIABLES,
  CREATE_MADE1_DETACHED_PROFILE_VARIABLES,
  CREATE_SAMMI1_DETACHED_PROFILE_VARIABLES,
  CREATE_SAMMI2_DETACHED_PROFILE_VARIABLES,
  CREATE_SOPHIA1_DETACHED_PROFILE_VARIABLES,
  CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES,
  CREATE_UMA1_DETACHED_PROFILE_VARIABLES,
} from './CreateDetachedProfileVars';
import {
  ATTACH_AVERY1_PROFILE_VARIABLES,
  ATTACH_BRIAN1_PROFILE_VARIABLES,
  ATTACH_JOSH1_PROFILE_VARIABLES,
  ATTACH_MADE1_PROFILE_VARIABLES,
  ATTACH_SAMMI1_PROFILE_VARIABLES,
  ATTACH_SAMMI2_PROFILE_VARIABLES,
  ATTACH_SOPHIA1_PROFILE_VARIABLES,
  ATTACH_SOPHIA2_PROFILE_VARIABLES,
  ATTACH_UMA1_PROFILE_VARIABLES,
} from './AttachProfileVars';
import {
  ADD_AVERY_PHOTOS_VARIABLES,
  ADD_BRIAN_PHOTOS_VARIABLES,
  ADD_JOSH_PHOTOS_VARIABLES,
  ADD_MADE_PHOTOS_VARIABLES,
  ADD_SAMMI_PHOTOS_VARIABLES, ADD_SOPHIA_PHOTOS_VARIABLES,
  ADD_UMA_PHOTOS_VARIABLES,
} from './UpdatePhotosVars';

const debug = require('debug')('dev:CreateTestDB');

const createTestDB = async (server) => {
  debug('creating new test db');

  try {
    const { mutate } = createTestClient(server);

    const createUsers = [
      CREATE_AVERY_USER_VARIABLES,
      CREATE_BRIAN_USER_VARIABLES,
      CREATE_JOEL_USER_VARIABLES,
      CREATE_JOSH_USER_VARIABLES,
      CREATE_SAMMI_USER_VARIABLES,
      CREATE_MADE_USER_VARIABLES,
      CREATE_UMA_USER_VARIABLES,
      CREATE_SOPHIA_USER_VARIABLES];

    const createDetachedProfiles = [
      CREATE_AVERY1_DETACHED_PROFILE_VARIABLES,
      CREATE_BRIAN1_DETACHED_PROFILE_VARIABLES,
      CREATE_JOSH1_DETACHED_PROFILE_VARIABLES,
      CREATE_SAMMI1_DETACHED_PROFILE_VARIABLES,
      CREATE_SAMMI2_DETACHED_PROFILE_VARIABLES,
      CREATE_MADE1_DETACHED_PROFILE_VARIABLES,
      CREATE_UMA1_DETACHED_PROFILE_VARIABLES,
      CREATE_SOPHIA1_DETACHED_PROFILE_VARIABLES,
      CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES];

    const attachProfiles = [
      ATTACH_AVERY1_PROFILE_VARIABLES,
      ATTACH_BRIAN1_PROFILE_VARIABLES,
      ATTACH_JOSH1_PROFILE_VARIABLES,
      ATTACH_SAMMI1_PROFILE_VARIABLES,
      ATTACH_SAMMI2_PROFILE_VARIABLES,
      ATTACH_MADE1_PROFILE_VARIABLES,
      ATTACH_UMA1_PROFILE_VARIABLES,
      ATTACH_SOPHIA1_PROFILE_VARIABLES,
      ATTACH_SOPHIA2_PROFILE_VARIABLES];

    const updatePhotos = [
      ADD_AVERY_PHOTOS_VARIABLES,
      ADD_BRIAN_PHOTOS_VARIABLES,
      ADD_JOSH_PHOTOS_VARIABLES,
      ADD_SAMMI_PHOTOS_VARIABLES,
      ADD_MADE_PHOTOS_VARIABLES,
      ADD_UMA_PHOTOS_VARIABLES,
      ADD_SOPHIA_PHOTOS_VARIABLES];

    const createUserPromises = [];
    for (const userVars of createUsers) {
      createUserPromises.push(mutate({
        mutation: CREATE_USER,
        variables: userVars,
      }));
    }
    const createUserResults = await Promise.all(createUserPromises);
    createUserResults.forEach((result) => { debug(result); });

    const createDetachedProfilePromises = [];
    for (const detachedProfileVars of createDetachedProfiles) {
      createDetachedProfilePromises.push(mutate({
        mutation: CREATE_DETACHED_PROFILE,
        variables: detachedProfileVars,
      }));
    }
    const createDetachedProfileResults = await Promise.all(createDetachedProfilePromises);
    createDetachedProfileResults.forEach((result) => { debug(result); });

    const attachProfilePromises = [];
    for (const attachProfileVars of attachProfiles) {
      attachProfilePromises.push(mutate({
        mutation: ATTACH_DETACHED_PROFILE,
        variables: attachProfileVars,
      }));
    }
    const attachProfileResults = await Promise.all(attachProfilePromises);
    attachProfileResults.forEach((result) => { debug(result); });

    const updatePhotoPromises = [];
    for (const updatePhotoVars of updatePhotos) {
      updatePhotoPromises.push(mutate({
        mutation: UPDATE_DISPLAYED_PHOTOS,
        variables: updatePhotoVars,
      }));
    }
    const updatePhotoResults = await Promise.all(updatePhotoPromises);
    updatePhotoResults.forEach((result) => { debug(result); });
    debug('all mutations successful');
  } catch (e) {
    debug(`an error occurred: ${e.toString()}`);
  }
};

export default createTestDB;
