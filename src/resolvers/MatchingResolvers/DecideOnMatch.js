import { Match } from '../../models/MatchModel';
import { User } from '../../models/UserModel';
import { datadogStats } from '../../DatadogHelper';
import {
  notifyEndorsementChatAcceptedRequest, sendMatchAcceptedMatchmakerPushNotification,
  sendMatchAcceptedPushNotification,
  sendMatchAcceptedServerMessage,
} from '../../FirebaseManager';
import { getAndValidateUserAndMatchObjects } from './MatchResolverUtils';
import { rollbackObject } from '../../../util/util';
import {
  recordAcceptMatchRequest,
  recordMatchOpened,
  recordRejectMatchRequest,
} from '../../models/UserActionModel';

const debug = require('debug')('dev:DecideOnMatch');
const errorLogger = require('debug')('error:DecideOnMatch');

const chalk = require('chalk');

const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));

export const decideOnMatchResolver = async ({ user_id, match_id, decision }) => {
  if (!['reject', 'accept'].includes(decision)) {
    throw new Error(`Unknown match action: ${decision}`);
  }
  datadogStats.increment('server.stats.match_decision_made');
  const acceptedMatch = decision === 'accept';
  if (acceptedMatch) {
    datadogStats.increment('server.stats.user_accepted_match');
  } else {
    datadogStats.increment('server.stats.user_rejected_match');
  }
  // verifies that user exists, match exists, user is part of match, user hasn't yet taken
  // accept/reject action on match
  const promisesResult = await getAndValidateUserAndMatchObjects(
    {
      user_id,
      match_id,
      validationType: decision,
    },
  );
  const user = promisesResult[0];
  const match = promisesResult[1];
  const otherUser = promisesResult[2];
  const initialUser = user.toObject();
  const initialMatch = match.toObject();
  const initialOtherUser = otherUser.toObject();

  // set object field names depending on whether user_id is sentFor or receivedBy in match
  const imSentFor = (user_id === match.sentForUser_id.toString());
  const myStatusKeyName = imSentFor ? 'sentForUserStatus' : 'receivedByUserStatus';
  const theirStatusKeyName = imSentFor ? 'receivedByUserStatus' : 'sentForUserStatus';
  const myStatusLastUpdatedKeyName = imSentFor
    ? 'sentForUserStatusLastUpdated'
    : 'receivedByUserStatusLastUpdated';

  // update my status in the match object
  const matchUpdateObj = {};
  matchUpdateObj[myStatusKeyName] = acceptedMatch ? 'accepted' : 'rejected';
  matchUpdateObj[myStatusLastUpdatedKeyName] = new Date();

  // update the match object
  const matchUpdated = await Match.findByIdAndUpdate(match_id, matchUpdateObj,
    { new: true })
    .exec()
    .catch(err => err);

  // remove the match_id reference in my requestedMatch_ids array
  const mePullRequestUpdate = await User.findByIdAndUpdate(user_id, {
    $pull: {
      requestedMatch_ids: match_id,
    },
  }, { new: true })
    .exec()
    .catch(err => err);

  // update the edge objects and push the match_id ref to the currentMatch_ids of both users
  // if the other user has also already made a decision
  let edgeUpdate = null;
  let isAMatch = false;
  const theirMatchStatus = matchUpdated[theirStatusKeyName];
  if (['accepted', 'rejected'].includes(theirMatchStatus)) {
    if (theirMatchStatus === 'accepted' && acceptedMatch) {
      isAMatch = true;
      edgeUpdate = await User.updateMany({
        _id: { $in: [user_id, otherUser._id.toString()] },
      }, {
        $push: {
          currentMatch_ids: match_id,
        },
        'edgeSummaries.$[element].edgeStatus': 'match',
        'edgeSummaries.$[element].lastStatusChange': new Date(),
      }, {
        arrayFilters: [{ 'element.match_id': match_id }],
      })
        .exec()
        .catch(err => err);
    } else {
      edgeUpdate = await User.updateMany({
        _id: { $in: [user_id, otherUser._id.toString()] },
      }, {
        'edgeSummaries.$[element].edgeStatus': 'rejected',
        'edgeSummaries.$[element].lastStatusChange': new Date(),
      }, {
        arrayFilters: [{ 'element.match_id': match_id }],
      })
        .exec()
        .catch(err => err);
    }
  }

  // roll back if any update failed
  if (mePullRequestUpdate instanceof Error || edgeUpdate instanceof Error) {
    debug('match decision failed, rolling back');
    let message = '';
    if (mePullRequestUpdate instanceof Error) {
      message += mePullRequestUpdate.toString();
    }
    if (edgeUpdate instanceof Error) {
      message += edgeUpdate.toString();
    }
    await rollbackObject({
      model: User,
      object_id: user_id,
      initialObject: initialUser,
      onSuccess: () => { debug('rolled back me user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back me user object: ${err}`); },
    });
    await rollbackObject({
      model: User,
      object_id: otherUser._id.toString(),
      initialObject: initialOtherUser,
      onSuccess: () => { debug('rolled back other user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back other user object: ${err}`); },
    });
    await rollbackObject({
      model: Match,
      object_id: match_id,
      initialObject: initialMatch,
      onSuccess: () => { debug('rolled back match object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back match object: ${err}`); },
    });
    return {
      success: false,
      message,
    };
  }
  if (acceptedMatch) {
    recordAcceptMatchRequest({ user, match, otherUser });
  } else {
    recordRejectMatchRequest({ user, match, otherUser });
  }
  if (isAMatch) {
    datadogStats.increment('server.stats.match_double_accepted');
    sendMatchAcceptedServerMessage({ chatID: match.firebaseChatDocumentID });
    sendMatchAcceptedPushNotification({ user, otherUser });
    sendMatchAcceptedPushNotification({ otherUser, user });
    const matchmakerMade = match.sentForUser_id.toString() !== match.sentByUser_id.toString();
    if (matchmakerMade) {
      datadogStats.increment('server.stats.match_double_accepted_matchmaker');
      const sentBy = await User.findById(match.sentByUser_id);
      let sentFor;
      let receivedBy;
      if (imSentFor) {
        sentFor = user;
        receivedBy = otherUser;
      } else {
        sentFor = otherUser;
        receivedBy = user;
      }
      const endorsementEdges = sentBy.endorsementEdges.filter(
        edge => edge.otherUser_id.toString() === sentFor._id.toString(),
      );
      if (endorsementEdges.length > 0) {
        const [endorsementEdge] = endorsementEdges;
        const endorsementChatId = endorsementEdge.firebaseChatDocumentID;
        notifyEndorsementChatAcceptedRequest({
          chatID: endorsementChatId,
          sentBy,
          sentFor,
          receivedBy,
        });
      }
      sendMatchAcceptedMatchmakerPushNotification({ sentBy, sentFor });
      // increment pear points
      // call .exec() to make sure this query/update actually runs, since the result isn't used
      // anywhere
      // it's not a big deal if pear points update fails, so this isn't included in rollback
      User.findByIdAndUpdate(match.sentByUser_id, {
        $inc: {
          pearPoints: 1,
        },
      }).exec();
      recordMatchOpened({ user, match, otherUser, sentBy });
    } else {
      datadogStats.increment('server.stats.match_double_accepted_personal');
      recordMatchOpened({ user, match, otherUser });
    }
  }
  return {
    success: true,
    match: matchUpdated,
  };
};
