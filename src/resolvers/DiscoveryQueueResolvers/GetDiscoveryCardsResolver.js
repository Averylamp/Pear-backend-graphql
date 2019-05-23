import { pick } from 'lodash';
import geolib from 'geolib';
import { User } from '../../models/UserModel';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import {
  DISCOVERY_CACHE_SIZE,
  DISCOVERY_RATE_LIMIT,
  MAX_DISCOVERY_CARDS_RETRIEVE, SEEDED_PROFILES_START,
} from '../../constants';
import { GET_DISCOVERY_CARDS_ERROR, GET_USER_ERROR } from '../ResolverErrorStrings';
import { shuffle } from '../../tests/Utils';

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
  if (matchingPreferences) {
    if (matchingPreferences.seekingGender) {
      matchStage['matchingDemographics.gender'] = { $in: matchingPreferences.seekingGender };
    }
    if (matchingPreferences.minAgeRange || matchingPreferences.maxAgeRange) {
      matchStage['matchingDemographics.age'] = {};
      if (matchingPreferences.minAgeRange) {
        matchStage['matchingDemographics.age'].$gte = matchingPreferences.minAgeRange;
      }
      if (matchingPreferences.maxAgeRange) {
        matchStage['matchingDemographics.age'].$lte = matchingPreferences.maxAgeRange;
      }
    }
    if (matchingPreferences.location && matchingPreferences.maxDistance) {
      matchStage['matchingDemographics.location.point'] = {
        $geoWithin: {
          $centerSphere: [
            matchingPreferences.location.point.coordinates,
            matchingPreferences.maxDistance / 3963.2],
        },
      };
    }
  }
  if (matchingDemographics && matchingDemographics.gender) {
    matchStage['matchingPreferences.seekingGender'] = matchingDemographics.gender;
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
    nTotal: Math.floor(1.5 * nUsers),
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
  return shuffle(users.slice(0, nUsers));
};

// generate the blacklist for a user who's feed we're generating
// me, my friends, my matches, my blocked users
const getUserBlacklist = ({ user, discoveryQueue }) => {
  const userBlacklist = new Set();
  userBlacklist.add(user._id);
  user.blockedUser_ids.forEach((blockedUser_id) => {
    userBlacklist.add(blockedUser_id);
  });
  user.edgeSummaries.map(summary => summary.otherUser_id)
    .forEach((edgeUser_id) => {
      userBlacklist.add(edgeUser_id);
    });
  user.endorsedUser_ids.map(endorsedUser_id => endorsedUser_id)
    .forEach((endorsedUser_id) => {
      userBlacklist.add(endorsedUser_id);
    });
  user.endorser_ids.map(endorser_id => endorser_id)
    .forEach((endorser_id) => {
      userBlacklist.add(endorser_id);
    });
  discoveryQueue.currentDiscoveryItems.forEach((discoveryItem) => {
    userBlacklist.add(discoveryItem.user_id);
  });
  return [...userBlacklist];
};

const getUserSkippedList = ({ discoveryQueue }) => discoveryQueue.skippedUser_ids;

const getDiscoveryItemsMaxNumber = ({ discoveryQueue, max }) => {
  let maxNCards = MAX_DISCOVERY_CARDS_RETRIEVE;
  const now = new Date();
  if (max && max < maxNCards) {
    maxNCards = max;
  }
  for (const rateLimitObj of DISCOVERY_RATE_LIMIT) {
    const nDecidedInInterval = discoveryQueue.decidedDiscoveryItems
      .filter(item => item.timestamp.getTime()
        > now.getTime() - rateLimitObj.intervalLengthMillis).length;
    const maxThisInterval = rateLimitObj.limit - nDecidedInInterval;
    if (maxThisInterval < maxNCards) {
      maxNCards = maxThisInterval;
    }
  }
  return maxNCards;
};

const locationsDifferent = ({ oldLocation, newLocation }) => {
  if (!oldLocation && !newLocation) {
    return false;
  }
  if (!oldLocation) {
    return true;
  }
  if (!newLocation) {
    return true;
  }
  if (oldLocation.point && newLocation.point) {
    const distance = geolib.getDistance({
      latitude: oldLocation.point.coordinates[1],
      longitude: oldLocation.point.coordinates[0],
    }, {
      latitude: newLocation.point.coordinates[1],
      longitude: newLocation.point.coordinates[0],
    });
    return distance > 5000;
  }
  return false;
};

const seekingGenderArraysDifferent = ({ arr1, arr2 }) => {
  const first = arr1.sort();
  const second = arr2.sort();
  if (first.length !== second.length) {
    return true;
  }
  for (let i = 0; i < first.length; i += 1) {
    if (first[i] !== second[i]) {
      return true;
    }
  }
  return false;
};

const filterUpdateNeeded = ({ discoveryQueue, newFilters }) => {
  const { currentFilters } = discoveryQueue;
  if (!newFilters) {
    return false;
  }
  if (!currentFilters) {
    return true;
  }
  if (currentFilters.minAgeRange !== newFilters.minAgeRange
    || currentFilters.maxAgeRange !== newFilters.maxAgeRange
    || currentFilters.maxDistance !== newFilters.maxDistance) {
    return true;
  }
  if (seekingGenderArraysDifferent({
    arr1: currentFilters.seekingGender, arr2: newFilters.seekingGender,
  })) {
    return true;
  }
  if (locationsDifferent({
    oldLocation: currentFilters.location, newLocation: newFilters.location,
  })) {
    return true;
  }
  return false;
};

export const refreshDiscoveryCache = async ({ user, discoveryQueue }) => {
  const modifiedDiscoveryQueue = discoveryQueue; // because of no-param-reassign
  const nCardsToGenerate = DISCOVERY_CACHE_SIZE
    - modifiedDiscoveryQueue.currentDiscoveryItems.length;
  const filters = discoveryQueue.currentFilters || user.matchingPreferences;
  let userBlacklist = getUserBlacklist({ user, discoveryQueue });
  const userSkippedList = getUserSkippedList({ discoveryQueue });
  let cardsRemaining = nCardsToGenerate;
  let cardsToPush = [];
  for (const ignoreSkipList of [false, true]) {
    for (const includeLocation of [true, false]) {
      for (const seededOnly of [true, false]) {
        let seededOnlyFinal = seededOnly;
        if (discoveryQueue.decidedDiscoveryItems
          && discoveryQueue.decidedDiscoveryItems.length > SEEDED_PROFILES_START) {
          seededOnlyFinal = false;
        }
        const params = {
          matchingPreferences: includeLocation
            ? filters : pick(filters, ['seekingGender', 'minAgeRange', 'maxAgeRange']),
          matchingDemographics: { gender: user.gender },
          blacklist: userBlacklist,
          skippedList: ignoreSkipList ? [] : userSkippedList,
          seededOnly: seededOnlyFinal,
          nUsers: cardsRemaining,
        };
        const usersToAdd = await getSuitableUsers(params);
        userBlacklist = userBlacklist.concat(usersToAdd.map(userToAdd => userToAdd._id));
        cardsToPush = cardsToPush.concat(usersToAdd);
        cardsRemaining -= usersToAdd.length;
        if (cardsRemaining === 0) {
          break;
        }
      }
      if (cardsRemaining === 0) {
        break;
      }
    }
    if (cardsRemaining === 0) {
      break;
    }
  }
  cardsToPush.map(discoveredUser => ({
    user_id: discoveredUser._id.toString(),
    timestamp: new Date(),
  })).forEach((discoveryItem) => {
    modifiedDiscoveryQueue.currentDiscoveryItems.push(discoveryItem);
  });
  return modifiedDiscoveryQueue.save();
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
  let newFilters = user.matchingPreferences;
  if (filters) {
    newFilters = pick(filters, ['seekingGender', 'minAgeRange', 'maxAgeRange']);
    if (filters.locationCoords) {
      if (filters.maxDistance) {
        newFilters.maxDistance = filters.maxDistance;
      }
      newFilters.location = {
        point: {
          coordinates: filters.locationCoords,
        },
      };
    }
    if (!newFilters.maxDistance) {
      newFilters.maxDistance = 25;
    }
  }
  if (filterUpdateNeeded({ discoveryQueue, newFilters })) {
    discoveryQueue.currentDiscoveryItems = [];
    discoveryQueue.currentFilters = newFilters;
    await refreshDiscoveryCache({ user, discoveryQueue, filters: newFilters });
  }
  return {
    success: true,
    items: discoveryQueue.currentDiscoveryItems.splice(0, maxNCards),
  };
};
