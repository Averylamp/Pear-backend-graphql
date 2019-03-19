import { pick, shuffle } from 'lodash';
import { User } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { DetachedProfile } from '../models/DetachedProfile';
import { DiscoveryItem, DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { EXPECTED_TICKS_PER_NEW_PROFILE, MAX_FEED_LENGTH } from '../constants';

const debug = require('debug')('dev:DiscoverProfile');

// gets a random element from an array
// returns null if array is empty
const getRandomFrom = array => (array.length > 0
  ? array[Math.floor(Math.random() * array.length)] : null);

// gets the age and gender fields from a user object or a detached profile
const getDemographicsFromUserOrDetachedProfile = user => pick(user, ['age', 'gender']);

// gets a user u such that:
// u's demographics satisfies constraints
// demographics satisfies u's constraints
// u is not in the blacklist
// returns null if can't find a user satisfying the above
const getUserSatisfyingConstraints = async (constraints, demographics, blacklist) => {
  debug(`blacklist is: ${blacklist}`);
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
    'matchingPreferences.seekingGender': demographics.gender,
    'matchingPreferences.minAgeRange': {
      $lte: demographics.age,
    },
    'matchingPreferences.maxAgeRange': {
      $gte: demographics.age,
    },
  });
  debug(`number of users satisfying constraints: ${users.length}`);
  return getRandomFrom(users);
};

// gets a summary object from a detached profile object
// a summary object contains a set of constraints, demographics, and blacklist
const getMatchingSummaryFromDetachedProfile = async detachedProfile => ({
  constraints: detachedProfile.matchingPreferences,
  demographics: getDemographicsFromUserOrDetachedProfile(detachedProfile),
  blacklist: [],
});

// gets a summary object from a user object
// returns null if user.isSeeking is false
const getMatchingSummaryFromUser = async (user, generateBlacklist = false) => (user.isSeeking
  ? {
    constraints: user.matchingPreferences,
    demographics: getDemographicsFromUserOrDetachedProfile(user),
    // when generateBlacklist = true, pull in all blocked profiles + profiles already with an edge
    // generateBlacklist is true when this is an endorsed user
    // (see (5), (6) of blacklist logic comment)
    blacklist: generateBlacklist ? [] : [],
  }
  : null);

// gets a summary object from a user profile ID
// returns null if the underlying user either has isSeeking set to false,
// or if we can't find the underlying user object
const getMatchingSummaryFromProfileId = async profile_id => (UserProfile
  .findById(profile_id)
  .exec()
  .then(endorsedUserProfile => User
    .findById(endorsedUserProfile.user_id)
    .exec())
  .then(endorsedUser => getMatchingSummaryFromUser(endorsedUser, true))
  .catch((err) => {
    debug(`error while retrieving profile with id ${profile_id}: ${err.toString()}`);
    return null;
  }));

// gets a summary object from a detached profile ID
// returns null if we can't find the detached profile object
const getMatchingSummaryFromDetachedProfileId = async detachedProfile_id => (DetachedProfile
  .findById(detachedProfile_id)
  .exec()
  .then(detachedProfile => getMatchingSummaryFromDetachedProfile(detachedProfile))
  .catch((err) => {
    debug(`error while retrieving detached profile with id ${detachedProfile_id}:
    ${err.toString()}`);
    return null;
  }));

// gets a user to put in user's discovery feed
// returns null if we can't find a next user to put in the discovery feed
// TODO: this should really be optimized to not make like 3 db calls per endorsed profile
export const nextDiscoveryItem = async (user) => {
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
    .map(item => item.user_id);
  userBlacklist = userBlacklist.concat(alreadyInFeed);
  debug(`userBlacklist is ${userBlacklist}`);

  const ProfileTypeEnum = {
    ME: 'me',
    ENDORSED_PROFILE_ID: 'endorsed profile',
    DETACHED_PROFILE_ID: 'detached profile',
  };
  let searchOrder = [];
  searchOrder.push({
    item: user,
    profileType: ProfileTypeEnum.ME,
  });
  user.endorsedProfile_ids.forEach((item) => {
    searchOrder.push({
      item,
      profileType: ProfileTypeEnum.ENDORSED_PROFILE_ID,
    });
  });
  user.detachedProfile_ids.forEach((item) => {
    searchOrder.push({
      item,
      profileType: ProfileTypeEnum.DETACHED_PROFILE_ID,
    });
  });
  debug('picking a profile to suggest for');
  searchOrder = shuffle(searchOrder);
  let summary = null;
  for (let i = 0; i < searchOrder.length; i += 1) {
    // this loop only executes once unless a suitable discovery item can't be found for the
    // corresponding user/profile. so awaits inside the loop are fine
    if (searchOrder[i].profileType === ProfileTypeEnum.ME) {
      summary = await getMatchingSummaryFromUser(searchOrder[i].item);
    } else if (searchOrder[i].profileType === ProfileTypeEnum.ENDORSED_PROFILE_ID) {
      summary = await getMatchingSummaryFromProfileId(searchOrder[i].item);
    } else {
      summary = await getMatchingSummaryFromDetachedProfileId(searchOrder[i].item);
    }

    const item_id = searchOrder[i].profileType === ProfileTypeEnum.ME
      ? searchOrder[i].item._id : searchOrder[i].item;
    if (summary !== null) {
      debug(`suggesting item for ${searchOrder[i].profileType}: ${item_id}`);
      summary.blacklist = summary.blacklist.concat(userBlacklist);
      const discoveredUser = await getUserSatisfyingConstraints(summary.constraints,
        summary.demographics,
        summary.blacklist);
      if (discoveredUser === null) {
        debug(`couldn't find profile in constraints for ${searchOrder[i].profileType}: ${item_id}`);
      } else {
        return discoveredUser;
      }
    } else {
      debug(`couldn't generate constraints for ${searchOrder[i].profileType}: ${item_id},
      or else the underlying object cannot have suggested discovery items`);
    }
  }
  return null;
};

// finds a suitable user for the passed-in user object's feed, and pushes to the user's feed object
// throws if can't find the user, if the user is deactivated, if couldn't find suitable discovery
// item, or if the update failed
// TODO: Send a push notification to user through firebase
export const updateDiscoveryWithNextItem = async (user) => {
  debug(`getting next discovery item and updating user feed: ${user._id}`);
  if (!user || user.deactivated) {
    throw Error('User doesn\'t exist or is deactivated');
  }
  const nextUser = await nextDiscoveryItem(user);
  if (nextUser === null) {
    throw Error('Could not retrieve next discoveryitem for user');
  }
  debug(`adding user with id: ${nextUser._id}`);
  return DiscoveryQueue
    .findOneAndUpdate({ user_id: user._id }, {
      $push: {
        currentDiscoveryItems: {
          $each: [new DiscoveryItem({ user_id: nextUser._id })],
          $slice: -1 * MAX_FEED_LENGTH,
        },
      },
    })
    .exec();
};

// finds a suitable user for the feed of the user corresponding to the passed-in user_id
// throws if updateDiscoveryWithNextItem throws, or if no user with the given id exists
export const updateDiscoveryForUserById = async (user_id) => {
  const user = await User.findById(user_id);
  if (user === null) {
    throw new Error(`User with id ${user_id} doesn't exist`);
  }
  return updateDiscoveryWithNextItem(user);
};

// updates the discovery feeds of each user with some probability
// if an update for any particular user fails, logs the error and continues to the next user
// should only throw an error if the query to the Users collection fails
export const updateAllDiscovery = async () => {
  const users = await User.find({});
  for (const user of users) {
    if (user.isSeeking || user.endorsedProfile_ids.length + user.detachedProfile_ids.length > 0) {
      if (Math.random() < (1 / EXPECTED_TICKS_PER_NEW_PROFILE)) {
        updateDiscoveryWithNextItem(user)
          .catch((err) => {
            debug(`An error occurred: ${err.toString()}`);
          });
      }
    }
  }
};

export default updateAllDiscovery;
