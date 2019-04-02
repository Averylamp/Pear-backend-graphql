import { User } from '../models/UserModel';
import { DetachedProfile } from '../models/DetachedProfile';
import { UserProfile } from '../models/UserProfileModel';
import { Match } from '../models/MatchModel';
import { createStatSnapshot } from '../models/StatsModel';

const debug = require('debug')('dev:Stats');

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
    .countDocuments()
    .exec();
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

const countDocumentOperationTimeSummary = async (countFn, currentDate) => {
  const oneDayAgo = new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const beginning = new Date(0);
  const [lastDay, lastWeek, lastMonth, allTime] = await Promise.all(
    [oneDayAgo, oneWeekAgo, oneMonthAgo, beginning]
      .map(date => countFn(date, currentDate)),
  );
  return {
    lastDay,
    lastWeek,
    lastMonth,
    allTime,
  };
};

export const saveStatsSnapshot = async () => {
  debug('generating and saving stats snapshot');
  const now = new Date();
  const nUsersPromise = countDocumentOperationTimeSummary(countUsersCreatedInRange, now);
  const nDetachedProfilesPromise = countDocumentOperationTimeSummary(
    countDetachedProfilesCreatedInRange, now,
  );
  const nProfileApprovalsPromise = countDocumentOperationTimeSummary(countProfilesApprovedInRange,
    now);
  const nPersonalMatchReqsPromise = countDocumentOperationTimeSummary(
    countPersonalMatchRequestsSentInRange, now,
  );
  const nMatchmakerMatchReqsPromise = countDocumentOperationTimeSummary(
    countMatchmakerMatchRequestsSentInRange, now,
  );
  const nPersonalMatchAcceptedPromise = countDocumentOperationTimeSummary(
    countPersonalMatchesAcceptedInRange, now,
  );
  const nMatchmakerMatchAcceptedPromise = countDocumentOperationTimeSummary(
    countMatchmakerMatchesAcceptedInRange, now,
  );
  const [
    nUsers,
    nDetachedProfiles,
    nProfileApprovals,
    nPersonalMatchReqs,
    nMatchmakerMatchReqs,
    nPersonalMatchAccepted,
    nMatchmakerMatchAccepted,
  ] = await Promise.all(
    [
      nUsersPromise,
      nDetachedProfilesPromise,
      nProfileApprovalsPromise,
      nPersonalMatchReqsPromise,
      nMatchmakerMatchReqsPromise,
      nPersonalMatchAcceptedPromise,
      nMatchmakerMatchAcceptedPromise],
  );
  const statInput = {
    nUsers,
    nDetachedProfiles,
    nProfileApprovals,
    nPersonalMatchReqs,
    nMatchmakerMatchReqs,
    nPersonalMatchAccepted,
    nMatchmakerMatchAccepted,
  };
  createStatSnapshot(statInput);
};
