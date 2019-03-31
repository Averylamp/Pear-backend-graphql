import { User } from '../models/UserModel';
import { DetachedProfile } from '../models/DetachedProfile';
import { UserProfile } from '../models/UserProfileModel';
import { Match } from '../models/MatchModel';
import { createStatSnapshot } from '../models/StatsModel';

const countDocumentsCreatedInRange = (start, end, model, customFilters = null) => {
  let filters = {};
  if (!customFilters) {
    filters = {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };
  } else {
    filters = customFilters;
  }
  return model.find(filters)
    .countDocuments();
};

const countUsersCreatedInRange = (start, end) => countDocumentsCreatedInRange(start, end, User);

const countDetachedProfilesCreatedInRange = (start, end) => countDocumentsCreatedInRange(start, end,
  DetachedProfile);

const countProfilesApprovedInRange = (start, end) => countDocumentsCreatedInRange(start, end,
  UserProfile);

const countPersonalMatchRequestsSentInRange = (start, end) => {
  const customFilters = {
    createdAt: {
      $gte: start,
      $lte: end,
    },
    isMatchmakerMade: false,
  };
  return countDocumentsCreatedInRange(start, end, Match, customFilters);
};

const countMatchmakerMatchRequestsSentInRange = (start, end) => {
  const customFilters = {
    createdAt: {
      $gte: start,
      $lte: end,
    },
    isMatchmakerMade: true,
  };
  return countDocumentsCreatedInRange(start, end, Match, customFilters);
};

const countPersonalMatchesAcceptedInRange = (start, end) => {
  const customFilters = {
    isMatchmakerMade: false,
    sentForUserStatus: 'accepted',
    receivedByUserStatus: 'accepted',
    $or: [
      {
        sentForUserStatusLastUpdated: {
          $gte: start,
          $lte: end,
        },
      }, {
        receivedByUserStatusLastUpdated: {
          $gte: start,
          $lte: end,
        },
      }],
  };
  return countDocumentsCreatedInRange(start, end, Match, customFilters);
};

const countMatchmakerMatchesAcceptedInRange = (start, end) => {
  const customFilters = {
    isMatchmakerMade: true,
    sentForUserStatus: 'accepted',
    receivedByUserStatus: 'accepted',
    $or: [
      {
        sentForUserStatusLastUpdated: {
          $gte: start,
          $lte: end,
        },
      }, {
        receivedByUserStatusLastUpdated: {
          $gte: start,
          $lte: end,
        },
      }],
  };
  return countDocumentsCreatedInRange(start, end, Match, customFilters);
};

const countDocumentOperationTimeSummary = (countFn, currentDate) => {
  const oneDayAgo = new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const beginning = new Date(0);
  return {
    lastDay: countFn(oneDayAgo, currentDate),
    lastWeek: countFn(oneWeekAgo, currentDate),
    lastMonth: countFn(oneMonthAgo, currentDate),
    allTime: countFn(beginning, currentDate),
  };
};

export const saveStatsSnapshot = () => {
  const now = new Date();
  const statInput = {
    nUsers: countDocumentOperationTimeSummary(countUsersCreatedInRange, now),
    nDetachedProfiles: countDocumentOperationTimeSummary(countDetachedProfilesCreatedInRange, now),
    nProfileApprovals: countDocumentOperationTimeSummary(countProfilesApprovedInRange, now),
    nPersonalMatchReqs: countDocumentOperationTimeSummary(countPersonalMatchRequestsSentInRange,
      now),
    nMatchmakerMatchReqs: countDocumentOperationTimeSummary(countMatchmakerMatchRequestsSentInRange,
      now),
    nPersonalMatchAccepted: countDocumentOperationTimeSummary(countPersonalMatchesAcceptedInRange,
      now),
    nMatchmakerMatchAccepted: countDocumentOperationTimeSummary(
      countMatchmakerMatchesAcceptedInRange, now
    ),
  };
  createStatSnapshot(statInput);
};
