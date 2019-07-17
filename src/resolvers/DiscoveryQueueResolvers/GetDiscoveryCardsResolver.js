import { pick } from 'lodash';
import geolib from 'geolib';
import { User } from '../../models/UserModel';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import {
  DISCOVERY_CACHE_SIZE, DISCOVERY_EVENT_RATE_LIMIT,
  DISCOVERY_RATE_LIMIT, DISCOVERY_REFRESH_THRESHOLD,
  MAX_DISCOVERY_CARDS_RETRIEVE, SEEDED_PROFILES_START,
} from '../../constants';
import { GET_DISCOVERY_CARDS_ERROR, GET_USER_ERROR } from '../ResolverErrorStrings';
import { shuffle } from '../../tests/Utils';

const errorLog = require('debug')('error:GetDiscoveryCardsResolver');

const getPipeline = ({
  matchingPreferences,
  matchingDemographics,
  blacklist,
  skippedList,
  seededOnly,
  event_id,
  nTotal,
}) => {
  const disallowed_ids = blacklist.concat(skippedList);
  const matchStage = {
    isSeeking: true,
    lowQuality: false,
    _id: {
      $nin: disallowed_ids,
    },
    displayedImagesCount: {
      $gte: 1,
    },
    $or: [
      {
        biosCount: {
          $gte: 1,
        },
      }, {
        questionResponsesCount: {
          $gte: 1,
        },
      },
    ],
  };
  if (event_id) {
    matchStage.event_ids = event_id;
  }
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
      matchStage['matchingDemographics.location'] = {
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
  event_id,
  nUsers,
}) => {
  const pipeline = getPipeline({
    matchingPreferences,
    matchingDemographics,
    blacklist,
    skippedList,
    seededOnly,
    event_id,
    nTotal: Math.floor(1.5 * nUsers),
  });
  const users = await User
    .aggregate(pipeline)
    .catch((err) => {
      errorLog(err);
      return null;
    });
  // pick the most recently active users
  users.sort((first, second) => second.lastActive - first.lastActive);
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

const getDiscoveryItemsMaxNumber = ({ discoveryQueue, max, eventMode }) => {
  let maxNCards = MAX_DISCOVERY_CARDS_RETRIEVE;
  const now = new Date();
  if (max && max < maxNCards) {
    maxNCards = max;
  }
  if (discoveryQueue.decidedDiscoveryItems.length > 20) {
    for (const rateLimitObj of (eventMode ? DISCOVERY_EVENT_RATE_LIMIT : DISCOVERY_RATE_LIMIT)) {
      const nDecidedInInterval = discoveryQueue.decidedDiscoveryItems
        .filter(item => item.timestamp.getTime()
          > now.getTime() - rateLimitObj.intervalLengthMillis).length;
      const maxThisInterval = rateLimitObj.limit - nDecidedInInterval;
      if (maxThisInterval < maxNCards) {
        maxNCards = maxThisInterval;
      }
    }
  }
  if (maxNCards < 0) {
    maxNCards = 0;
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
  if (discoveryQueue.currentGender !== newFilters.currentGender) {
    return true;
  }
  if ((discoveryQueue.currentEvent_id || '').toString()
    !== (newFilters.event_id || '').toString()) {
    return true;
  }
  return false;
};

export const addCardsToCache = async ({ user, discoveryQueue, nCardsToAdd }) => {
  const now = new Date();
  const modifiedDiscoveryQueue = discoveryQueue; // because of no-param-reassign
  const filters = discoveryQueue.currentFilters || user.matchingPreferences;
  let userBlacklist = getUserBlacklist({ user, discoveryQueue });
  const allSkippedList = getUserSkippedList({ discoveryQueue });
  const lastDaySkippedList = discoveryQueue.decidedDiscoveryItems.filter(item => (
    item.action === 'skip' && item.timestamp.getTime() > now.getTime() - 24 * 60 * 60 * 1000
  )).map(item => item.user_id);
  let cardsRemaining = nCardsToAdd;
  let cardsToPush = [];
  for (const ignoreSkipList of [false, true]) {
    for (const includeLocation of [true, false]) {
      for (const widerAge of [0, 2]) {
        for (const seededOnly of [true, false]) {
          let seededOnlyFinal = seededOnly;
          if (discoveryQueue.decidedDiscoveryItems
            && discoveryQueue.decidedDiscoveryItems.length > SEEDED_PROFILES_START) {
            seededOnlyFinal = false;
          }
          const preferencesFields = ['seekingGender', 'minAgeRange', 'maxAgeRange'];
          if (includeLocation) {
            preferencesFields.push('location');
            preferencesFields.push('maxDistance');
          }
          const matchingPreferences = pick(filters, preferencesFields);
          if (matchingPreferences.minAgeRange) {
            matchingPreferences.minAgeRange -= widerAge;
            if (matchingPreferences.minAgeRange < 18) {
              matchingPreferences.minAgeRange = 18;
            }
          }
          if (matchingPreferences.maxAgeRange) {
            matchingPreferences.maxAgeRange += widerAge;
          }
          const params = {
            matchingPreferences,
            matchingDemographics: { gender: discoveryQueue.currentGender },
            blacklist: userBlacklist,
            skippedList: ignoreSkipList ? lastDaySkippedList : allSkippedList,
            seededOnly: seededOnlyFinal,
            nUsers: cardsRemaining,
          };
          if (discoveryQueue.currentEvent_id) {
            params.event_id = discoveryQueue.currentEvent_id;
          }
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
  // this is an intermediate object with the following properties:
  // seekingGender (reqd)
  // maxDistance (reqd)
  // minAgeRange (reqd)
  // maxAgeRange (reqd)
  // location (reqd, LocationSchema)
  // myGender (not required, i.e. if user.gender is not set and filters.myGender isn't either)
  // event_id (not required)
  const newFilters = user.matchingPreferences;
  newFilters.currentGender = user.gender;
  if (filters) {
    newFilters.seekingGender = filters.seekingGender;
    newFilters.minAgeRange = filters.minAgeRange;
    newFilters.maxAgeRange = filters.maxAgeRange;
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
    if (filters.myGender) {
      newFilters.currentGender = filters.myGender;
    }
    if (filters.event_id) {
      newFilters.event_id = filters.event_id;
      // note that event_id is always cleared if it's not included in newFilters
    }
  }
  const maxNCards = getDiscoveryItemsMaxNumber({
    discoveryQueue,
    max,
    eventMode: !!newFilters.event_id,
  });
  if (maxNCards === 0) {
    return {
      success: true,
      items: [],
    };
  }
  if (filterUpdateNeeded({ discoveryQueue, newFilters })) {
    discoveryQueue.currentDiscoveryItems = [];
    discoveryQueue.currentFilters = pick(newFilters, ['seekingGender', 'minAgeRange',
      'maxAgeRange', 'maxDistance', 'location']);

    if (newFilters.currentGender) {
      discoveryQueue.currentGender = newFilters.currentGender;
    } else {
      delete discoveryQueue.currentGender;
    }
    if (newFilters.event_id) {
      discoveryQueue.currentEvent_id = newFilters.event_id;
    } else {
      discoveryQueue.currentEvent_id = undefined;
    }
    await addCardsToCache({
      user,
      discoveryQueue,
      nCardsToAdd: DISCOVERY_CACHE_SIZE,
    });
  } else if (discoveryQueue.currentDiscoveryItems.length < DISCOVERY_REFRESH_THRESHOLD) {
    await addCardsToCache({
      user,
      discoveryQueue,
      nCardsToAdd: DISCOVERY_CACHE_SIZE - discoveryQueue.currentDiscoveryItems.length,
    });
  }
  return {
    success: true,
    items: discoveryQueue.currentDiscoveryItems.splice(0, maxNCards),
  };
};
