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
// throws error if can't find a user satisfying the above
const getUserSatisfyingConstraints = async (constraints, demographics, blacklist) => {
  debug(`blacklist is: ${blacklist}`);
  const users = await User.find({
    isSeeking: true,
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
    $where: 'this.profile_ids.length > 0',
  });
  debug(`number of users satisfying constraints: ${users.length}`);
  const ret = getRandomFrom(users);
  if (!ret) {
    throw new Error('no users found in constraints');
  }
  return ret;
};

// gets a summary object from a detached profile object
// a summary object contains a set of constraints, demographics, blacklist, isSeeking
const getMatchingSummaryFromDetachedProfile = async detachedProfile => ({
  constraints: detachedProfile.matchingPreferences,
  demographics: getDemographicsFromUserOrDetachedProfile(detachedProfile),
  blacklist: [],
  isSeeking: true,
});

// gets a summary object from a user object
// a summary object contains a set of constraints, demographics, blacklist, isSeeking
const getMatchingSummaryFromUser = async (user, generateBlacklist = false) => {
  let blacklist = [];
  if (generateBlacklist) {
    blacklist = [...new Set(user.edgeSummaries.map(summary => summary.otherUser_id))];
    blacklist = blacklist.concat(user.blockedUser_ids);
  }
  return {
    constraints: user.matchingPreferences,
    demographics: getDemographicsFromUserOrDetachedProfile(user),
    // when generateBlacklist = true, pull in all blocked profiles + profiles already with an edge
    // generateBlacklist is true when this is an endorsed user
    // (see (5), (6) of blacklist logic comment)
    blacklist,
    isSeeking: user.isSeeking,
  };
};

// gets a summary object from a user profile ID
// throws if can't find user profile or underlying user
const getMatchingSummaryFromProfileId = async profile_id => (UserProfile
  .findById(profile_id)
  .exec()
  .then((endorsedUserProfile) => {
    if (!endorsedUserProfile) {
      throw new Error(`no user profile with id ${profile_id}`);
    }
    return User
      .findById(endorsedUserProfile.user_id)
      .exec();
  })
  .then((endorsedUser) => {
    if (!endorsedUser) {
      throw new Error(`no endorsed user corresponding to profile with id ${profile_id}`);
    }
    return getMatchingSummaryFromUser(endorsedUser, true);
  }));

// gets a summary object from a detached profile ID
// throws if we can't find the detached profile object
const getMatchingSummaryFromDetachedProfileId = async detachedProfile_id => (DetachedProfile
  .findById(detachedProfile_id)
  .exec()
  .then((detachedProfile) => {
    if (!detachedProfile) {
      throw new Error(`no detached profile with id ${detachedProfile_id}`);
    }
    return getMatchingSummaryFromDetachedProfile(detachedProfile);
  }));

// gets a user to put in user's discovery feed
// returns null if we can't find a next user to put in the discovery feed
export const nextDiscoveryItem = async (user) => {
  // blacklist includes several types of blocked users:
  // 0. the user themselves
  // 1. users already in user's discovery feed
  // 2. users who have an edge with this user
  // 3. users in user's blocked list
  // 3.5. users this user has endorsed
  // 4. (for a specific profile) users who already have an edge with this profile
  // 5. (for a specific profile) users in the specific profile's blocked list
  let userBlacklist = [];
  userBlacklist.push(user._id);
  const alreadyInFeed = (await DiscoveryQueue.findOne({ user_id: user._id }))
    .currentDiscoveryItems
    .map(item => item.user_id);
  userBlacklist = userBlacklist.concat(alreadyInFeed);
  userBlacklist = userBlacklist.concat(user.blockedUser_ids);
  userBlacklist = userBlacklist.concat(
    [...new Set(user.edgeSummaries.map(summary => summary.otherUser_id))],
  );
  const endorsedProfiles = await UserProfile.find(
    { _id: { $in: user.endorsedProfile_ids } },
  );
  userBlacklist = userBlacklist.concat(endorsedProfiles.map(pf => pf.user_id));

  const ProfileTypeEnum = {
    ME: 'me',
    ENDORSED_PROFILE_ID: 'endorsed profile',
    DETACHED_PROFILE_ID: 'detached profile',
  };
  let searchOrder = [];
  //  Objects with:
  //  item: [UserObject | DetachedProfile_id | UserProfile_id]
  //  profileType: Enum of type [UserObject | Document_ID]
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
    try {
      if (searchOrder[i].profileType === ProfileTypeEnum.ME) {
        summary = await getMatchingSummaryFromUser(searchOrder[i].item);
      } else if (searchOrder[i].profileType === ProfileTypeEnum.ENDORSED_PROFILE_ID) {
        summary = await getMatchingSummaryFromProfileId(searchOrder[i].item);
      } else {
        summary = await getMatchingSummaryFromDetachedProfileId(searchOrder[i].item);
      }
    } catch (e) {
      debug(`error occurred while trying to get matching summary: ${e.toString}`);
      continue;
    }

    if (!summary || !summary.isSeeking) {
      continue;
    }

    const item_id = searchOrder[i].profileType === ProfileTypeEnum.ME
      ? searchOrder[i].item._id : searchOrder[i].item;
    debug(`suggesting item for ${searchOrder[i].profileType}: ${item_id}`);
    summary.blacklist = summary.blacklist.concat(userBlacklist);
    return getUserSatisfyingConstraints(summary.constraints,
      summary.demographics,
      summary.blacklist);
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
  debug(`adding user with id: ${nextUser._id}`);
  return DiscoveryQueue
    .findOneAndUpdate({ user_id: user._id }, {
      $push: {
        currentDiscoveryItems: {
          $each: [new DiscoveryItem({ user_id: nextUser._id })],
          $slice: -1 * MAX_FEED_LENGTH,
        },
        historyDiscoveryItems: {
          $each: [new DiscoveryItem({ user_id: nextUser._id })],
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
