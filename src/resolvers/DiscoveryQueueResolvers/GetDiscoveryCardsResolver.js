import { pick } from 'lodash';
import { User } from '../../models/UserModel';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import { DISCOVERY_RATE_LIMIT } from '../../constants';
import { GET_DISCOVERY_CARDS_ERROR, GET_USER_ERROR } from '../ResolverErrorStrings';

const mongoose = require('mongoose');
const errorLog = require('debug')('error:DiscoverProfile');

const getPipeline = ({
  matchingPreferences,
  matchingDemographics,
  blacklist,
  skippedList,
  seededOnly,
  nTotal,
}) => {
  const disallowed_ids = blacklist.concat(skippedList);
  const matchStage = {
    isSeeking: true,
    _id: {
      $nin: disallowed_ids,
    },
    endorserCount: {
      $gte: 1,
    },
    displayedImagesCount: {
      $gte: 1,
    },
  };
  if (matchingPreferences && matchingPreferences.gender) {
    matchStage['matchingDemographics.gender'] = matchingPreferences.gender;
  }
  if (matchingPreferences && (matchingPreferences.minAgeRange || matchingPreferences.maxAgeRange)) {
    matchStage['matchingDemographics.age'] = {};
    if (matchingPreferences && matchingPreferences.minAgeRange) {
      matchStage['matchingDemographics.age'].$gte = matchingPreferences.minAgeRange;
    }
    if (matchingPreferences && matchingPreferences.maxAgeRange) {
      matchStage['matchingDemographics.age'].$lte = matchingPreferences.maxAgeRange;
    }
  }
  if (matchingPreferences && matchingPreferences.location && matchingPreferences.maxDistance) {
    matchStage['matchingDemographics.location.point'] = {
      $geoWithin: {
        $centerSphere: [
          matchingDemographics.location.point.coordinates,
          matchingDemographics.maxDistance / 3963.2],
      },
    };
  }
  if (matchingDemographics && matchingDemographics.gender) {
    matchStage['matchingPreferences.gender'] = matchingDemographics.gender;
  }
  if (seededOnly) {
    matchStage.seeded = true;
  }
  return [
    {
      $match: matchStage,
    },
    {
      $sample: {
        size: nTotal,
      },
    },
  ];
};

// get some users based on a pipeline. then return the most active
const getSuitableUsers = async ({
  matchingPreferences,
  matchingDemographics,
  blacklist,
  skippedList,
  seededOnly,
  nUsers,
}) => {
  const pipeline = getPipeline({
    matchingPreferences,
    matchingDemographics,
    blacklist,
    skippedList,
    seededOnly,
    nTotal: 2 * nUsers,
  });
  const users = await User
    .aggregate(pipeline)
    .catch((err) => {
      errorLog(err);
      return null;
    });
  // pick the most recently active users
  users.sort((first, second) => {
    if (second.lastActiveTimes.length === 0) {
      return -1;
    }
    if (first.lastActiveTimes.length === 0) {
      return 1;
    }
    return second.lastActiveTimes[second.lastActiveTimes.length - 1]
      - first.lastActiveTimes[first.lastActiveTimes.length - 1];
  });
  return users.slice(0, nUsers);
};

// generate the blacklist for a user who's feed we're generating
// me, my friends, my matches, my blocked users
const getUserBlacklist = async ({ user }) => {
  const userBlacklist = new Set();
  userBlacklist.add(user._id.toString());
  user.blockedUser_ids.forEach((blockedUser_id) => {
    userBlacklist.add(blockedUser_id.toString());
  });
  user.edgeSummaries.map(summary => summary.otherUser_id.toString())
    .forEach((edgeUser_id) => {
      userBlacklist.add(edgeUser_id);
    });
  user.endorsedUser_ids.map(endorsedUser_id => endorsedUser_id.toString())
    .forEach((endorsedUser_id) => {
      userBlacklist.add(endorsedUser_id);
    });
  user.endorser_ids.map(endorser_id => endorser_id.toString())
    .forEach((endorser_id) => {
      userBlacklist.add(endorser_id);
    });
  return userBlacklist;
};

const getUserSkippedList = async ({ discoveryQueue }) => discoveryQueue.skippedUser_ids;

const getDiscoveryItemsMaxNumber = ({ discoveryQueue, max }) => {
  let maxNCards = 20;
  const now = new Date();
  if (max && max < maxNCards) {
    maxNCards = max;
  }
  for (const rateLimitObj of DISCOVERY_RATE_LIMIT) {
    const nDecidedInInterval = discoveryQueue.decidedDiscoveryItems
      .filter(item => item.timestamp.getTime()
        > now.getTime() - rateLimitObj.intervalLengthMillis);
    const maxThisInterval = rateLimitObj.limit - nDecidedInInterval;
    if (maxThisInterval < maxNCards) {
      maxNCards = maxThisInterval;
    }
  }
  return maxNCards;
};

export const getDiscoveryCards = async ({ user_id, filters, max }) => {
  const user = await User.findById(user_id);
  if (!user) {
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  const discoveryQueue = await DiscoveryQueue.findOne({ user_id });
  if (!discoveryQueue) {
    return {
      success: false,
      message: GET_DISCOVERY_CARDS_ERROR,
    };
  }
  const maxNCards = getDiscoveryItemsMaxNumber({ discoveryQueue, max });
  if (maxNCards === 0) {
    return {
      success: true,
      items: [],
    };
  }
  let userBlacklist = getUserBlacklist({ user });
  const userSkippedList = getUserSkippedList({ discoveryQueue });
  let cardsRemaining = maxNCards;
  let cardsToReturn = [];
  for (const ignoreSkipList of [false, true]) {
    for (const includeLocation of [true, false]) {
      for (const seededOnly of [true, false]) {
        const params = {
          matchingPreferences: includeLocation
            ? filters : pick(filters, ['seekingGender', 'minAgeRange', 'maxAgeRange']),
          matchingDemographics: { gender: user.gender },
          blacklist: userBlacklist,
          skippedList: ignoreSkipList ? [] : userSkippedList,
          seededOnly,
          nUsers: cardsRemaining,
        };
        const usersToAdd = await getSuitableUsers(params);
        userBlacklist = userBlacklist.concat(usersToAdd.map(userToAdd => userToAdd._id.toString()));
        cardsToReturn = cardsToReturn.concat(usersToAdd);
        cardsRemaining -= usersToAdd.length;
        if (cardsRemaining.length === 0) {
          break;
        }
      }
      if (cardsRemaining.length === 0) {
        break;
      }
    }
    if (cardsRemaining.length === 0) {
      break;
    }
  }
  const discoveryItems = cardsToReturn.map(discoveredUser => ({
    _id: mongoose.Types.ObjectId(),
    user_id: discoveredUser._id.toString(),
    timestamp: new Date(),
  }));
  return {
    success: true,
    items: discoveryItems,
  };
};
