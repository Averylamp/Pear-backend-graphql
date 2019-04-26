import { pick } from 'lodash';
import { UserOld } from '../models-old/UserModel';
import { UserProfileOld } from '../models-old/UserProfileModel';
import { createUserObject } from '../models/UserModel';

const debug = require('debug')('dev:MigrateUsers');

export const transferrableVibes = [
  'forbidden fruit',
  'coco-nuts',
  'extra like guac',
  'cherry bomb',
  'spicy',
  'baddest radish',
  'just add water',
];

export const userProfileVibeToObject = (profile, vibeContent) => {
  const ret = {
    author_id: profile.creatorUser_id,
    authorFirstName: profile.creatorFirstName,
    hidden: false,
    updatedAt: profile.createdAt,
    createdAt: profile.createdAt,
  };
  switch (vibeContent) {
    case 'forbidden fruit':
      ret.content = 'Forbidden Fruit';
      ret.color = {
        red: 0.0,
        green: 0.7,
        blue: 0.25,
        alpha: 1.0,
      };
      ret.icon = {
        assetString: 'vibe-icon-forbidden-fruit',
      };
      break;
    case 'coco-nuts':
      ret.content = 'Coco-NUTS';
      ret.color = {
        red: 0.45,
        green: 0.29,
        blue: 0.25,
        alpha: 1.0,
      };
      ret.icon = {
        assetString: 'vibe-icon-coconuts',
      };
      break;
    case 'extra like guac':
      ret.content = 'Extra Like Guac';
      ret.color = {
        red: 0.26,
        green: 0.56,
        blue: 0.09,
        alpha: 1.0,
      };
      ret.icon = {
        assetString: 'vibe-icon-extra-like-guac',
      };
      break;
    case 'cherry bomb':
      ret.content = 'Cherry Bomb';
      ret.color = {
        red: 0.9,
        green: 0.0,
        blue: 0.0,
        alpha: 1.0,
      };
      ret.icon = {
        assetString: 'vibe-icon-cherry-bomb',
      };
      break;
    case 'spicy':
      ret.content = 'Spicy';
      ret.color = {
        red: 1.0,
        green: 0.09,
        blue: 0.0,
        alpha: 1.0,
      };
      ret.icon = {
        assetString: 'vibe-icon-spicy',
      };
      break;
    case 'baddest radish':
      ret.content = 'Baddest Radish';
      ret.color = {
        red: 0.0,
        green: 0.58,
        blue: 0.18,
        alpha: 1.0,
      };
      ret.icon = {
        assetString: 'vibe-icon-baddest-radish',
      };
      break;
    case 'just add water':
      ret.content = 'Just Add Water';
      ret.color = {
        red: 1.0,
        green: 0.0,
        blue: 0.23,
        alpha: 1.0,
      };
      ret.icon = {
        assetString: 'vibe-icon-just-add-water',
      };
      break;
    default:
      break;
  }
  return ret;
};

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
    for (const vibeContent of profile.vibes) {
      if (transferrableVibes.includes(vibeContent)) {
        newUser.vibes.push(userProfileVibeToObject(profile, vibeContent));
      }
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
