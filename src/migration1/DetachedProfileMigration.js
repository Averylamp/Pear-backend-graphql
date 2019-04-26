import { pick } from 'lodash';
import { DetachedProfileOld } from '../models-old/DetachedProfile';
import { UserProfileOld } from '../models-old/UserProfileModel';
import { createDetachedProfileObject } from '../models/DetachedProfile';
import { transferrableVibes, userProfileVibeToObject } from './UserMigration';

const debug = require('debug')('dev:MigrateUsers');

const detachedProfileContentStringToObject = (profile, content) => ({
  author_id: profile.creatorUser_id,
  authorFirstName: profile.creatorFirstName,
  content,
  hidden: false,
  updatedAt: profile.createdAt,
  createdAt: profile.createdAt,
});

export const migrateDetachedProfile = async (detachedProfile) => {
  const dpObj = detachedProfile.toObject();
  const dpKeepFields = pick(dpObj, [
    '_id',
    'updatedAt',
    'createdAt',
    'status',
    'creatorUser_id',
    'creatorFirstName',
    'firstName',
    'phoneNumber',
    'age',
    'gender',
    'school',
    'schoolYear',
    'images',
    'matchingDemographics',
    'matchingPreferences',
  ]);
  const newDp = {};
  Object.assign(newDp, dpKeepFields);
  // add and populate new content fields
  newDp.boasts = [];
  newDp.roasts = [];
  newDp.vibes = [];
  newDp.questionResponses = [];
  newDp.bio = detachedProfileContentStringToObject(dpObj, dpObj.bio);
  newDp.dos = dpObj.dos
    .map(doContent => detachedProfileContentStringToObject(dpObj, doContent));
  newDp.donts = dpObj.donts
    .map(dontContent => detachedProfileContentStringToObject(dpObj, dontContent));
  newDp.interests = dpObj.interests
    .map(interestContent => detachedProfileContentStringToObject(dpObj, interestContent));
  newDp.vibes = dpObj.vibes.filter(vibe => transferrableVibes.includes(vibe))
    .map(vibeContent => userProfileVibeToObject(dpObj, vibeContent));
  if (dpObj.status === 'accepted') {
    if (dpObj.userProfile_id) {
      const userProfile = await UserProfileOld.findById(dpObj.userProfile_id.toString());
      if (userProfile) {
        newDp.endorsedUser_id = userProfile.user_id;
        newDp.acceptedTime = userProfile.createdAt;
      } else {
        debug(`couldn't find user profile with id ${dpObj.userProfile_id.toString()}`);
        debug(`detached profile id is ${dpObj._id.toString()}`);
      }
    } else {
      debug('accepted but couldn\'t find corresponding UP');
    }
  }

  return createDetachedProfileObject(newDp, true);
};

export const migrateDetachedProfiles = async () => {
  const migrateDetachedProfilePromises = [];
  let count = 0;
  return new Promise((resolve, reject) => {
    DetachedProfileOld.find({})
      .cursor()
      .on('data', (detachedProfile) => {
        migrateDetachedProfilePromises
          .push(migrateDetachedProfile(detachedProfile)
            .then((doc) => {
              if (!doc) {
                debug('doc not found');
                debug(`dp id is ${detachedProfile._id}`);
              } else {
                count += 1;
                debug(`${count} migrated so far: migrated ${doc.firstName}`);
              }
            }));
      })
      .on('end', async () => {
        Promise.all(migrateDetachedProfilePromises)
          .then(() => {
            debug('Finished migrating detached profiles');
            resolve();
          })
          .catch((err) => {
            debug(`error with migrating detached profiles: ${err}`);
            reject(err);
          });
      });
  });
};
