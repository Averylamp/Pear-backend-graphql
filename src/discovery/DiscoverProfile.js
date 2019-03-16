import { User } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { DetachedProfile } from '../models/DetachedProfile';
import { DiscoveryQueue } from '../models/DiscoveryQueueModel';

const debug = require('debug')('dev:DiscoverProfile');

const getRandomFrom = array => (array.length > 0
  ? array[Math.floor(Math.random() * array.length)] : null);

const getUserSatisfyingConstraints = async (constraints, demographics, blacklist) => {
  try {
    const users = await User.find({
      gender: {
        $in: constraints.seekingGender,
      },
      age: {
        $lte: constraints.maxAgeRange,
        $gte: constraints.minAgeRange,
      },
      _id: {
        $nin: blacklist,
      },
    });
    return getRandomFrom(users);
  } catch (e) {
    throw e;
  }
};

// TODO: this should really be optimized to not make like 3 db calls per endorsed profile
export const nextDiscoveryItem = async (user) => {
  try {
    // TODO: full blacklist logic
    // blacklist includes several types of blocked users:
    // 0. the user themselves
    // 1. users already in user's discovery feed
    // 2. TODO: users who have an edge with this user
    // 3. TODO: users in user's blocked list
    // 4. TODO: (for a specific profile) users who already have an edge with this profile
    // 5. TODO: (for a specific profile) users in the specific profile's blocked list
    let userBlacklist = [];
    userBlacklist.push(user._id);
    const alreadyInFeed = (await DiscoveryQueue.findOne({ user_id: user._id }))
      .currentDiscoveryItems
      .filter(item => item.user_id);
    userBlacklist += alreadyInFeed;

    const myPreferences = [];
    if (user.isDiscovering) {
      myPreferences.push({
        constraints: user.matchingPreferences,
        demographics: user.matchingDemographics,
        blacklist: userBlacklist,
      });
    }
    const endorsedProfilePreferencePromises = [];
    for (let i = 0; i < user.endorsedProfile_ids.length; i += 1) {
      const profile_id = user.endorsedProfile_ids[i];
      endorsedProfilePreferencePromises.push(UserProfile.findById(profile_id)
        .exec()
        .then(endorsedUserProfile => User
          .findById(endorsedUserProfile.user_id)
          .exec())
        .then(endorsedUser => ({
          constraints: endorsedUser.matchingPreferences,
          demographics: endorsedUser.matchingDemographics,
          blacklist: userBlacklist,
        }))
        .catch((err) => {
          debug(`error while retrieving profile with id ${profile_id}: ${err.toString()}`);
          return null;
        }));
    }
    // filter(Boolean) filters out falsy values, i.e. null
    const endorsedProfilePreferences = (await Promise.all(endorsedProfilePreferencePromises))
      .filter(Boolean);

    const detachedProfilePreferencePromises = [];
    for (let i = 0; i < user.detachedProfile_ids.length; i += 1) {
      const profile_id = user.detachedProfile_ids[i];
      detachedProfilePreferencePromises.push(DetachedProfile.findById(profile_id)
        .exec()
        .then(detachedProfile => ({
          constraints: detachedProfile.matchingPreferences,
          demographics: detachedProfile.matchingDemographics,
          blacklist: userBlacklist,
        }))
        .catch((err) => {
          debug(`error while retrieving detached profile with id ${profile_id}: ${err.toString()}`);
        }));
    }
    const detachedProfilePreferences = (await Promise.all(endorsedProfilePreferencePromises))
      .filter(Boolean);

    const allPreferences = myPreferences + endorsedProfilePreferences + detachedProfilePreferences;
    const chosenPreference = getRandomFrom(allPreferences);
    return await getUserSatisfyingConstraints(chosenPreference.constraints,
      chosenPreference.demographics,
      chosenPreference.blacklist);
  } catch (e) {
    throw e;
  }
};

export default nextDiscoveryItem;
