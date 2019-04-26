import { User } from '../models/UserModel';
import { DiscoveryItem, DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { EXPECTED_TICKS_PER_NEW_PROFILE, MAX_FEED_LENGTH } from '../constants';

const debug = require('debug')('dev:DiscoverProfile');
const errorLog = require('debug')('error:DiscoverProfile');

const getSeededUserPipeline = ({ gender, blacklist }) => {
  const matchStage = {
    isSeeking: true,
    gender,
    seeded: true,
    _id: {
      $nin: blacklist,
    },
    endorserCount: {
      $gte: 1,
    },
    displayedImagesCount: {
      $gte: 1,
    },
  };
  return [
    {
      $match: matchStage,
    },
    {
      $sample: {
        size: 1,
      },
    },
  ];
};
/*
const getSeededSchoolUserPipeline = ({ gender, blacklist }) => {
  const matchStage = {
    isSeeking: true,
    gender,
    school: {
      $in: FUZZY_SCHOOL_LIST,
    },
    _id: {
      $nin: blacklist,
    },
    endorserCount: {
      $gte: 1,
    },
    displayedImagesCount: {
      $gte: 1,
    },
  };
  return [
    {
      $match: matchStage,
    },
    {
      $sample: {
        size: 1,
      },
    },
  ];
};

// DEPRECATED FOR NOW
// gets a user u such that:
// u's demographics satisfies constraints
// demographics satisfies u's constraints
// u is not in the blacklist
// returns null if can't find a user satisfying the above
const getUserSatisfyingConstraintsPipeline = ({ constraints, demographics, blacklist }) => {
  const matchStage = {
    isSeeking: true,
    'matchingDemographics.age': {
      $lte: constraints.maxAgeRange,
      $gte: constraints.minAgeRange,
    },
    _id: {
      $nin: blacklist,
    },
    endorserCount: {
      $gte: 1,
    },
    displayedImagesCount: {
      $gte: 1,
    },
  };
  if (constraints && constraints.location) {
    matchStage['matchingDemographics.location.point'] = {
      $geoWithin: {
        $centerSphere: [
          constraints.location.point.coordinates,
          constraints.maxDistance / 3963.2],
      },
    };
  }
  if (constraints && constraints.seekingGender) {
    matchStage['matchingDemographics.gender'] = {
      $in: constraints.seekingGender,
    };
  }
  if (demographics && demographics.gender) {
    matchStage['matchingPreferences.seekingGender'] = demographics.gender;
  }
  if (demographics && demographics.age) {
    matchStage['matchingPreferences.minAgeRange'] = {
      $lte: demographics.age,
    };
    matchStage['matchingPreferences.maxAgeRange'] = {
      $gte: demographics.age,
    };
  }

  return [
    {
      $match: matchStage,
    },
    {
      $sample: {
        size: 1,
      },
    },
  ];
};
*/

const getUserSatisfyingGenderConstraintPipeline = ({ gender, blacklist }) => {
  const matchStage = {
    isSeeking: true,
    gender,
    _id: {
      $nin: blacklist,
    },
    endorserCount: {
      $gte: 1,
    },
    displayedImagesCount: {
      $gte: 1,
    },
  };

  return [
    {
      $match: matchStage,
    },
    {
      $sample: {
        size: 1,
      },
    },
  ];
};

const getUserForPipeline = async ({
  constraints, demographics, gender, blacklist, pipelineFn,
}) => {
  const users = await User
    .aggregate(pipelineFn({
      constraints,
      demographics,
      gender,
      blacklist,
    }))
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

// generate the blacklist for a user who's feed we're generating, NOT a user we're suggesting for
const getUserBlacklist = async ({ userObj }) => {
  const userBlacklist = new Set();
  userBlacklist.add(userObj._id);
  const dq = await DiscoveryQueue.findOne({ user_id: userObj._id });
  dq.historyDiscoveryItems
    .map(item => item.user_id)
    .forEach((feedUser_id) => {
      userBlacklist.add(feedUser_id);
    });
  userObj.blockedUser_ids.forEach((blockedUser_id) => {
    userBlacklist.add(blockedUser_id);
  });
  userObj.edgeSummaries.map(summary => summary.otherUser_id)
    .forEach((edgeUser_id) => {
      userBlacklist.add(edgeUser_id);
    });
  userObj.endorsedUser_ids.map(endorsedUser_id => endorsedUser_id.toString())
    .forEach((endorsedUser_id) => {
      userBlacklist.add(endorsedUser_id);
    });
  return userBlacklist;
};

// gets a user to put in user's discovery feed
// returns null if we can't find a next user to put in the discovery feed
export const nextDiscoveryItem = async ({
  userObj, pipelineFn = getUserSatisfyingGenderConstraintPipeline, gender,
}) => {
  // blacklist includes several types of blocked users:
  // 0. the user themselves
  // 1. users already in user's discovery feed
  // 2. users who have an edge with this user
  // 3. users in user's blocked list
  // 4. users this user has endorsed
  const userBlacklist = [...(await getUserBlacklist({ userObj }))];
  try {
    const discoveredUser = await getUserForPipeline({
      gender,
      blacklist: userBlacklist,
      pipelineFn,
    });
    if (discoveredUser) {
      return discoveredUser;
    }
  } catch (err) {
    errorLog(err);
    errorLog('Error occurred, couldn\'t find discovery item');
  }
  errorLog(`No suggested discovery items with gender ${gender} for User: ${userObj._id}`);
  return null;
};

// finds a suitable user for the passed-in user object's feed, and pushes to the user's feed object
// throws if can't find the user, if the user is deactivated, if couldn't find suitable discovery
// item, or if the update failed
// TODO: Send a push notification to user through firebase
export const updateDiscoveryWithNextItem = async ({ userObj }) => {
  const discoveryQueue = await DiscoveryQueue.findOne({ user_id: userObj._id }).exec();
  let pipelineFns = [
    getSeededUserPipeline,
    getUserSatisfyingGenderConstraintPipeline,
  ];
  if (process.env.REGEN_DB === 'true') {
    pipelineFns = [getUserSatisfyingGenderConstraintPipeline];
  }
  let index = 0;
  if (discoveryQueue.historyDiscoveryItems.length < 20) {
    index = 0;
  } else {
    index = 1;
  }

  debug(`Getting next discovery item and updating user feed: ${userObj._id}`);

  let gender = Math.random() > 0.5 ? 'male' : 'female';
  if (Math.random() < 0.05 && !process.env.REGEN_DB === 'true') {
    gender = 'nonbinary';
  }
  if (!userObj || userObj.deactivated) {
    throw Error('User doesn\'t exist or is deactivated');
  }
  let nextUser = null;
  while (!nextUser && index < pipelineFns.length) {
    nextUser = await nextDiscoveryItem({
      userObj,
      pipelineFn: pipelineFns[index],
      gender,
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
export const updateDiscoveryForUserById = async ({ user_id }) => {
  try {
    const user = await User.findById(user_id);
    if (user === null) {
      throw new Error(`User with id ${user_id} doesn't exist`);
    }
    return updateDiscoveryWithNextItem({ userObj: user });
  } catch (e) {
    errorLog(`An error occurred populating feed of ${user_id}: ${e}`);
    return null;
  }
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
