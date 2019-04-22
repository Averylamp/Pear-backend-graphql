import { pick } from 'lodash';
import { UserOld } from '../models-old/UserModel';
import { UserProfileOld } from '../models-old/UserProfileModel';
import { createUserObject } from '../models/UserModel';

const debug = require('debug')('dev:MigrateUsers');

const userProfileContentStringToObject = (profile, content) => ({
  author_id: profile.creatorUser_id,
  authorFirstName: profile.creatorFirstName,
  content,
  hidden: false,
  updatedAt: profile.createdAt,
  createdAt: profile.createdAt,
});

export const migrateUser = async (user) => {
  const userObj = user.toObject();
  // these fields are carried over, possibly with changes to the required/optional status but
  // no other changes
  const userKeepFields = pick(userObj, [
    '_id',
    'updatedAt',
    'createdAt',
    'deactivated',
    'firebaseAuthID',
    'facebookId',
    'facebookAccessToken',
    'email',
    'emailVerified',
    'phoneNumber',
    'phoneNumberVerified',
    'firstName',
    'lastName',
    'thumbnailURL',
    'gender',
    'age',
    'birthdate',
    'school',
    'schoolYear',
    'schoolEmail',
    'schoolEmailVerified',
    'isSeeking',
    'pearPoints',
    'displayedImages',
    'bankImages',
    'detachedProfile_ids',
    'discoveryQueue_id',
    'blockedUser_ids',
    'requestedMatch_ids',
    'currentMatch_ids',
    'edgeSummaries',
    'firebaseRemoteInstanceID',
    'referredByCode',
    'referralCode',
    'seeded',
  ]);
  const newUser = {};
  Object.assign(newUser, userKeepFields);
  // new schema has a strict subset of fields for endorsementEdges, so this is ok
  newUser.endorsementEdges = userObj.endorsementEdges;
  // new schema has same fields for prefs/demos, just some are now optional
  newUser.matchingDemographics = userObj.matchingDemographics;
  newUser.matchingPreferences = userObj.matchingPreferences;
  if (userObj.lastActive) {
    // this field is not required in the old schema
    // in the new schema it is required and renamed
    // the mongoose schema sets a default, so if the old object doesn't have lastActive it's still
    // fine
    newUser.lastActiveTimes = userObj.lastActive;
  }
  // the default for this is true in the new schema. users had no option to set it previously so
  // set everyone to true
  newUser.isSeeking = true;

  // new fields introduced in new schema: endorser ids, endorsee ids, content fields
  newUser.endorser_ids = [];
  newUser.endorsedUser_ids = [];
  newUser.bios = [];
  newUser.boasts = [];
  newUser.roasts = [];
  newUser.questionResponses = [];
  newUser.vibes = [];
  newUser.dos = [];
  newUser.donts = [];
  newUser.interests = [];
  // get profiles made by this user and populate endorsees
  let endorsedProfiles = await UserProfileOld.find({ creatorUser_id: userObj._id.toString() });
  endorsedProfiles = endorsedProfiles.map(profile => profile.toObject());
  for (const endorsedProfile of endorsedProfiles) {
    newUser.endorsedUser_ids.push(endorsedProfile.user_id);
  }

  // get profiles for this user and populate endorsers biographical info
  let profiles = await UserProfileOld.find({ user_id: userObj._id.toString() });
  profiles = profiles.map(profile => profile.toObject());
  for (const profile of profiles) {
    newUser.endorser_ids.push(profile.creatorUser_id);
    newUser.bios.push(userProfileContentStringToObject(profile, profile.bio));
    for (const doContent of profile.dos) {
      newUser.dos.push(userProfileContentStringToObject(profile, doContent));
    }
    for (const dontContent of profile.donts) {
      newUser.donts.push(userProfileContentStringToObject(profile, dontContent));
    }
    for (const interestContent of profile.interests) {
      newUser.interests.push(userProfileContentStringToObject(profile, interestContent));
    }
    // we are not carrying over vibes
    // boasts, roasts, and questionResponses dont exist in old schema
  }

  // newly introduced count fields
  newUser.endorserCount = newUser.endorser_ids.length;
  newUser.endorsedUsersCount = newUser.endorsedUser_ids.length;
  newUser.detachedProfilesCount = userObj.detachedProfile_ids.length;
  newUser.displayedImagesCount = userObj.displayedImages.length;

  // lastEditedTimes is required but has a default, so we're good there
  // second argument is "skipTimestamps"
  return createUserObject(newUser, true);
};

export const migrateUsers = async () => {
  const migrateUserPromises = [];
  let count = 0;
  return new Promise((resolve, reject) => {
    UserOld.find({})
      .cursor()
      .on('data', (user) => {
        migrateUserPromises
          .push(migrateUser(user)
            .then((doc) => {
              if (!doc) {
                debug('doc not found');
                debug(`user id is ${user._id}`);
              } else {
                count += 1;
                debug(`${count} migrated so far: migrated ${doc.firstName}`);
              }
            }));
      })
      .on('end', async () => {
        Promise.all(migrateUserPromises)
          .then(() => {
            debug('Finished migration');
            resolve();
          })
          .catch((err) => {
            debug(`error with migration: ${err}`);
            reject(err);
          });
      });
  });
};
