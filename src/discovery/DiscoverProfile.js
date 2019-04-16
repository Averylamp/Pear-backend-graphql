import { shuffle } from 'lodash';
import { User } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { DetachedProfile } from '../models/DetachedProfile';
import { DiscoveryItem, DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { EXPECTED_TICKS_PER_NEW_PROFILE, FUZZY_SCHOOL_LIST, MAX_FEED_LENGTH } from '../constants';

const debug = require('debug')('dev:DiscoverProfile');
const errorLog = require('debug')('error:DiscoverProfile');

const getSeededUserPipeline = ({ constraints, demographics, blacklist }) => ([
  {
    $match: {
      isSeeking: true,
      seeded: true,
      'matchingDemographics.gender': {
        $in: constraints.seekingGender,
      },
      'matchingPreferences.seekingGender': demographics.gender,
      _id: {
        $nin: blacklist,
      },
      profileCount: {
        $gte: 0,
      },
    },
  },
  {
    $sample: {
      size: 1,
    },
  },
]);

const getSeededSchoolUserPipeline = ({ constraints, demographics, blacklist }) => ([
  {
    $match: {
      isSeeking: true,
      'matchingDemographics.gender': {
        $in: constraints.seekingGender,
      },
      'matchingPreferences.seekingGender': demographics.gender,
      _id: {
        $nin: blacklist,
      },
      school: {
        $in: FUZZY_SCHOOL_LIST,
      },
      profileCount: {
        $gte: 0,
      },
    },
  },
  {
    $sample: {
      size: 1,
    },
  },
]);

// gets a user u such that:
// u's demographics satisfies constraints
// demographics satisfies u's constraints
// u is not in the blacklist
// returns null if can't find a user satisfying the above
const getUserSatisfyingConstraintsPipeline = ({ constraints, demographics, blacklist }) => ([
  {
    $match: {
      isSeeking: true,
      'matchingDemographics.gender': {
        $in: constraints.seekingGender,
      },
      'matchingDemographics.age': {
        $lte: constraints.maxAgeRange,
        $gte: constraints.minAgeRange,
      },
      'matchingDemographics.location.point': {
        $geoWithin: {
          $centerSphere: [
            constraints.location.point.coordinates,
            constraints.maxDistance / 3963.2],
        },
      },
      'matchingPreferences.seekingGender': demographics.gender,
      'matchingPreferences.minAgeRange': {
        $lte: demographics.age,
      },
      'matchingPreferences.maxAgeRange': {
        $gte: demographics.age,
      },
      _id: {
        $nin: blacklist,
      },
      profileCount: {
        $gte: 0,
      },
    },
  },
  {
    $sample: {
      size: 1,
    },
  },
]);

const getUserSatisfyingGenderConstraintsPipeline = ({ constraints, demographics, blacklist }) => ([
  {
    $match: {
      isSeeking: true,
      'matchingDemographics.gender': {
        $in: constraints.seekingGender,
      },
      'matchingPreferences.seekingGender': demographics.gender,
      _id: {
        $nin: blacklist,
      },
      profileCount: {
        $gte: 0,
      },
    },
  },
  {
    $sample: {
      size: 1,
    },
  },
]);

const getUserForPipeline = async ({
  constraints, demographics, blacklist, pipelineFn,
}) => {
  const users = await User
    .aggregate(pipelineFn({ constraints, demographics, blacklist }))
    .catch((err) => {
      errorLog(err);
      return null;
    });
  if (users.length > 0) {
    return users[0];
  }
  errorLog('no users found in constraints');
  return null;
};

// gets a summary object from a detached profile object
// a summary object contains a set of constraints, demographics, blacklist, isSeeking
const getMatchingSummaryFromDetachedProfile = async ({ detachedProfileObj }) => ({
  constraints: detachedProfileObj.matchingPreferences,
  demographics: detachedProfileObj.matchingDemographics,
  blacklist: new Set(),
  isSeeking: true,
});

// gets a summary object from a user object
// a summary object contains a set of constraints, demographics, blacklist, isSeeking
const getMatchingSummaryFromUser = async ({ userObj }) => {
  const blacklist = new Set(userObj.edgeSummaries.map(summary => summary.otherUser_id));
  userObj.blockedUser_ids.forEach((blockedUser_id) => {
    blacklist.add(blockedUser_id);
  });


  return {
    constraints: userObj.matchingPreferences,
    demographics: userObj.matchingDemographics,
    // when generateBlacklist = true, pull in all blocked profiles + profiles already with an edge
    // generateBlacklist is true when this is an endorsed user
    // (see (5), (6) of blacklist logic comment)
    blacklist,
    isSeeking: userObj.isSeeking,
  };
};

// gets a summary object from a user profile ID
// throws if can't find user profile or underlying user
const getMatchingSummaryFromProfileId = async ({ profile_id }) => (UserProfile
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
    return getMatchingSummaryFromUser({ userObj: endorsedUser });
  }));

// gets a summary object from a detached profile ID
// throws if we can't find the detached profile object
const getMatchingSummaryFromDetachedProfileId = async ({ detachedProfile_id }) => (
  DetachedProfile
    .findById(detachedProfile_id)
    .exec()
    .then((detachedProfile) => {
      if (!detachedProfile) {
        throw new Error(`no detached profile with id ${detachedProfile_id}`);
      }
      return getMatchingSummaryFromDetachedProfile({ detachedProfileObj: detachedProfile });
    }));

// generate the blacklist for a user who's feed we're generating, NOT a user we're suggesting for
const getUserBlacklist = async ({ userObj }) => {
  const userBlacklist = new Set();
  userBlacklist.add(userObj._id);
  const alreadyInFeed = (await DiscoveryQueue.findOne({ user_id: userObj._id }))
    .currentDiscoveryItems
    .map(item => item.user_id);
  alreadyInFeed.forEach((feedUser_id) => {
    userBlacklist.add(feedUser_id);
  });
  userObj.blockedUser_ids.forEach((blockedUser_id) => {
    userBlacklist.add(blockedUser_id);
  });
  userObj.edgeSummaries.map(summary => summary.otherUser_id)
    .forEach((edgeUser_id) => {
      userBlacklist.add(edgeUser_id);
    });
  const endorsedProfiles = await UserProfile.find(
    { _id: { $in: userObj.endorsedProfile_ids } },
  );
  endorsedProfiles.map(pf => pf.user_id)
    .forEach((endorsedUser_id) => {
      userBlacklist.add(endorsedUser_id);
    });
  return userBlacklist;
};

// gets a user to put in user's discovery feed
// returns null if we can't find a next user to put in the discovery feed
export const nextDiscoveryItem = async ({
  userObj, pipelineFn = getUserSatisfyingConstraintsPipeline,
}) => {
  // blacklist includes several types of blocked users:
  // 0. the user themselves
  // 1. users already in user's discovery feed
  // 2. users who have an edge with this user
  // 3. users in user's blocked list
  // 3.5. users this user has endorsed
  // 4. (for a specific profile) users who already have an edge with this profile
  // 5. (for a specific profile) users in the specific profile's blocked list
  const userBlacklist = await getUserBlacklist({ userObj });
  const ProfileTypeEnum = {
    ME: 'me',
    ENDORSED_PROFILE_ID: 'endorsed profile',
    DETACHED_PROFILE_ID: 'detached profile',
  };
  let searchOrder = [];
  //  Objects with:
  //  item: [UserObject | DetachedProfile_id | UserProfile_id]
  //  profileType: Enum of type [UserObject | Document_ID]

  // If you don't have any profiles, discovery shouldn't suggest a profile for your personal user
  // obj
  if (userObj.profile_ids.length) {
    searchOrder.push({
      item: userObj,
      profileType: ProfileTypeEnum.ME,
    });
  }

  userObj.endorsedProfile_ids.forEach((item) => {
    searchOrder.push({
      item,
      profileType: ProfileTypeEnum.ENDORSED_PROFILE_ID,
    });
  });
  userObj.detachedProfile_ids.forEach((item) => {
    searchOrder.push({
      item,
      profileType: ProfileTypeEnum.DETACHED_PROFILE_ID,
    });
  });
  searchOrder = shuffle(searchOrder);
  debug(`Seach for ${userObj._id}, includes ${searchOrder.length} items.`);

  if (searchOrder.length === 0) {
    debug('No profiles associated with User.  Resorting to User object default');
    const forcedSeekingUserObj = userObj;
    forcedSeekingUserObj.isSeeking = true;
    searchOrder.push({
      item: forcedSeekingUserObj,
      profileType: ProfileTypeEnum.ME,
    });
  }

  let summary = null;
  for (let i = 0; i < searchOrder.length; i += 1) {
    // this loop only executes once unless a suitable discovery item can't be found for the
    // corresponding user/profile. so awaits inside the loop are fine
    try {
      if (searchOrder[i].profileType === ProfileTypeEnum.ME) {
        summary = await getMatchingSummaryFromUser({ userObj: searchOrder[i].item });
      } else if (searchOrder[i].profileType === ProfileTypeEnum.ENDORSED_PROFILE_ID) {
        summary = await getMatchingSummaryFromProfileId({ profile_id: searchOrder[i].item });
      } else {
        summary = await getMatchingSummaryFromDetachedProfileId({
          detachedProfile_id: searchOrder[i].item,
        });
      }
    } catch (e) {
      errorLog(`Error occurred while trying to get matching summary: ${e.toString()}`);
      continue;
    }

    if (!summary || !summary.isSeeking) {
      errorLog('not seeking');
      continue;
    }

    const item_id = searchOrder[i].profileType === ProfileTypeEnum.ME
      ? searchOrder[i].item._id : searchOrder[i].item;
    debug(`Suggesting item for ${searchOrder[i].profileType}: ${item_id}`);
    summary.blacklist = [...new Set([...summary.blacklist, ...userBlacklist])];
    try {
      const discoveredUser = await getUserForPipeline({
        constraints: summary.constraints,
        demographics: summary.demographics,
        blacklist: summary.blacklist,
        pipelineFn,
      });
      if (discoveredUser) {
        return discoveredUser;
      }
      errorLog(`Couldn't find profile in constraints for ${searchOrder[i].profileType}: ${item_id}`);
    } catch (err) {
      errorLog(err);
      errorLog(
        `Couldn't find profile in constraints for ${searchOrder[i].profileType}: ${item_id}`,
      );
    }
  }
  errorLog(`No suggested discovery items for User: ${userObj._id}`);
  return null;
};

// finds a suitable user for the passed-in user object's feed, and pushes to the user's feed object
// throws if can't find the user, if the user is deactivated, if couldn't find suitable discovery
// item, or if the update failed
// TODO: Send a push notification to user through firebase
export const updateDiscoveryWithNextItem = async ({ userObj }) => {
  const discoveryQueue = await DiscoveryQueue.findOne({ user_id: userObj._id }).exec();
  const pipelineFns = [
    getSeededUserPipeline,
    getSeededSchoolUserPipeline,
    getUserSatisfyingConstraintsPipeline,
    getUserSatisfyingGenderConstraintsPipeline,
  ];
  let index = 0;
  if (discoveryQueue.historyDiscoveryItems.length < 15) {
    index = 0;
  } else if (discoveryQueue.historyDiscoveryItems.length < 25) {
    index = 1;
  } else {
    index = 2;
  }

  debug(`Getting next discovery item and updating user feed: ${userObj._id}`);
  if (!userObj || userObj.deactivated) {
    throw Error('User doesn\'t exist or is deactivated');
  }
  let nextUser = null;
  while (!nextUser && index < pipelineFns.length) {
    nextUser = await nextDiscoveryItem({
      userObj,
      pipelineFn: pipelineFns[index],
    });
    index += 1;
  }

  if (nextUser) {
    debug(`Found and Adding user with id: ${nextUser._id}`);
    return DiscoveryQueue
      .findOneAndUpdate({ user_id: userObj._id }, {
        $push: {
          currentDiscoveryItems: {
            $each: [new DiscoveryItem({ user_id: nextUser._id })],
            $slice: -1 * MAX_FEED_LENGTH,
          },
          historyDiscoveryItems: {
            $each: [new DiscoveryItem({ user_id: nextUser._id })],
          },
        },
      }, { new: true })
      .exec();
  }
  throw new Error(`Couldn't find any discovery items for user ${userObj._id}`);
};

// finds a suitable user for the feed of the user corresponding to the passed-in user_id
// throws if updateDiscoveryWithNextItem throws, or if no user with the given id exists
export const updateDiscoveryForUserById = async ({ user_id }) => {
  const user = await User.findById(user_id);
  if (user === null) {
    throw new Error(`User with id ${user_id} doesn't exist`);
  }
  return updateDiscoveryWithNextItem({ userObj: user });
};

// updates the discovery feeds of each user with some probability
// if an update for any particular user fails, logs the error and continues to the next user
// should only throw an error if the query to the Users collection fails
export const updateAllDiscovery = async () => {
  // https://mongoosejs.com/docs/api.html#query_Query-cursor
  User.find({})
    .cursor()
    .on('data', (user) => {
      if (Math.random() < (1 / EXPECTED_TICKS_PER_NEW_PROFILE)) {
        updateDiscoveryWithNextItem({ userObj: user })
          .catch((err) => {
            errorLog(`An error occurred: ${err.toString()}`);
          });
      }
    })
    .on('end', () => {
      debug('Finished Generating Discovery For All Users');
    });
};

export default updateAllDiscovery;
