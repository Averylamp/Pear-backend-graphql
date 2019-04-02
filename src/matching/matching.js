import nanoid from 'nanoid';
import { receiveRequest, sendRequest, User } from '../models/UserModel';
import { createMatchObject, Match } from '../models/MatchModel';
import { UserProfile } from '../models/UserProfileModel';
import {
  createMatchChat,
  getChatDocPathFromId,
  notifyEndorsementChatAcceptedRequest,
  notifyEndorsementChatNewRequest,
  sendMatchAcceptedMatchmakerPushNotification,
  sendMatchAcceptedPushNotification,
  sendMatchAcceptedServerMessage,
  sendMatchReceivedByPushNotification,
  sendMatchRequestServerMessage,
  sendMatchSentForPushNotification,
} from '../FirebaseManager';
import {
  GET_USER_ERROR,
  SEND_MATCH_REQUEST_ERROR,
  WRONG_CREATOR_ERROR,
} from '../resolvers/ResolverErrorStrings';

const debug = require('debug')('dev:Matching');
const errorLogger = require('debug')('error:Matching');

const chalk = require('chalk');

const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));

const mongoose = require('mongoose');

// utility function for rolling back a specific db operation on unsuccessful unmatches and
// accept/reject ops
export const rollbackEdgeUpdates = (rollbackSummary) => {
  for (const rollbackItem of rollbackSummary) {
    const updateObj = {
      'edgeSummaries.$[element].edgeStatus': rollbackItem.rollbackEdgeStatus,
      'edgeSummaries.$[element].lastStatusChange': rollbackItem.rollbackEdgeLastUpdated,
    };
    updateObj[rollbackItem.matchesListOp] = {
      currentMatch_ids: rollbackItem.match_id,
    };
    debug(`rollbackEdgeUpdate: ${updateObj}`);
    User.findByIdAndUpdate(rollbackItem.user_id, updateObj, {
      new: true,
      arrayFilters: [{ 'element.match_id': rollbackItem.match_id }],
    }, (err) => {
      if (err) {
        debug(`Failed to roll back my edge status updates: ${err.toString()}`);
      } else {
        debug('Rolled back my edge status updates');
      }
    });
  }
};

export const getAndValidateUserAndMatchObjects = async ({ user_id, match_id, validationType }) => {
  const userPromise = User.findById(user_id)
    .exec()
    .catch(() => null);
  const matchPromise = Match.findById(match_id)
    .exec()
    .catch(() => null);
  const [user, match] = await Promise.all([userPromise, matchPromise]);
  if (!user) {
    errorLog(`Couldn't find user with id ${user_id}`);
    throw new Error(`Couldn't find user with id ${user_id}`);
  }
  if (!match) {
    errorLog(`Couldn't find match with id ${match_id}`);
    throw new Error(`Couldn't find match with id ${match_id}`);
  }
  let otherUser_id = null;
  if (user_id === match.sentForUser_id.toString()) {
    otherUser_id = match.receivedByUser_id;
  } else if (user_id === match.receivedByUser_id.toString()) {
    otherUser_id = match.sentForUser_id;
  } else {
    errorLog(`User ${user_id} is not a part of match ${match_id}`);
    throw new Error(`User ${user_id} is not a part of match ${match_id}`);
  }
  const otherUser = await User.findById(otherUser_id);
  if (!otherUser) {
    errorLog(`Couldn't find user's match partner with id ${otherUser_id}`);
    throw new Error(`Couldn't find user's match partner with id ${otherUser_id}`);
  }
  if (['reject', 'accept'].includes(validationType)) {
    if (user_id === match.sentForUser_id.toString()) {
      if (['rejected', 'accepted'].includes(match.sentForUserStatus)) {
        errorLog(`User ${user_id} has already taken action on request ${match_id}`);
        throw new Error(`User ${user_id} has already taken action on request ${match_id}`);
      }
    } else if (user_id === match.receivedByUser_id.toString()) {
      if (['rejected', 'accepted'].includes(match.receivedByUserStatus)) {
        errorLog(`User ${user_id} has already taken action on request ${match_id}`);
        throw new Error(`User ${user_id} has already taken action on request ${match_id}`);
      }
    }
  }
  if (validationType === 'unmatch') {
    if (match.sentForUserStatus !== 'accepted' || match.receivedByUserStatus !== 'accepted') {
      // No need to log it because it isn't fatal
      throw new Error('This request was not mutually accepted');
    }
  }
  return [user, match, otherUser];
};

export const createNewMatch = async ({
  sentByUser_id, sentForUser_id, receivedByUser_id, _id = mongoose.Types.ObjectId(),
}) => {
  const matchID = _id;
  // determine whether this is a matchmaker request or a personal request
  const matchmakerMade = (sentByUser_id !== sentForUser_id);

  // fetch all relevant user objects and perform basic validation
  const sentByPromise = User.findById(sentByUser_id)
    .exec()
    .catch(() => null);
  const sentForPromise = User.findById(sentForUser_id)
    .exec()
    .catch(() => null);
  const receivedByPromise = User.findById(receivedByUser_id)
    .exec()
    .catch(() => null);
  let profilePromise = null;
  if (matchmakerMade) {
    profilePromise = UserProfile.findOne({
      user_id: sentForUser_id,
      creatorUser_id: sentByUser_id,
    })
      .catch(() => null);
  }
  const [sentBy, sentFor, receivedBy, profile] = await Promise
    .all([sentByPromise, sentForPromise, receivedByPromise, profilePromise]);
  if (!sentBy) {
    errorLog(`Couldn't find sentBy with id ${sentByUser_id}`);
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  if (!sentFor) {
    errorLog(`Couldn't find sentFor user with id ${sentForUser_id}`);
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  if (!receivedBy) {
    errorLog(`Couldn't find receivedBy user with id ${receivedByUser_id}`);
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  if (matchmakerMade && !profile) {
    errorLog(`Matchmaker ${sentByUser_id} has not made a profile
        for ${sentForUser_id}`);
    return {
      success: false,
      message: WRONG_CREATOR_ERROR,
    };
  }

  const firebaseId = nanoid(20);

  // create the match object
  const matchInput = {
    _id: matchID,
    sentByUser_id,
    sentForUser_id,
    receivedByUser_id,
    isMatchmakerMade: matchmakerMade,
    firebaseChatDocumentID: firebaseId,
    firebaseChatDocumentPath: getChatDocPathFromId(firebaseId),
  };
  if (!matchmakerMade) {
    matchInput.sentForUserStatus = 'accepted';
  }
  const matchPromise = createMatchObject(matchInput)
    .catch(err => err);

  // add edges and push to requestedMatch_ids via operations on the user model
  const sentForUserModelUpdateFn = matchmakerMade ? receiveRequest : sendRequest;
  const createSentForEdgePromise = sentForUserModelUpdateFn(sentFor, receivedBy, matchID)
    .catch(err => err);
  const createReceivedByEdgePromise = receiveRequest(receivedBy, sentFor, matchID)
    .catch(err => err);

  // create the firebase chat object
  const createChatPromise = createMatchChat({
    documentID: firebaseId,
    firstPerson: sentFor,
    secondPerson: receivedBy,
    mongoID: matchID,
  })
    .catch(err => err);

  const [match, sentForEdgeResult, receivedByEdgeResult, createChatResult] = await Promise
    .all([matchPromise, createSentForEdgePromise, createReceivedByEdgePromise, createChatPromise]);

  // rollbacks if any updates failed
  if (match instanceof Error
    || sentForEdgeResult instanceof Error
    || receivedByEdgeResult instanceof Error
    || createChatResult instanceof Error) {
    let errorMessage = '';
    if (match instanceof Error) {
      errorLog(`Failed to create match Object: ${match.toString()}`);
      errorMessage += match.toString();
    } else {
      match.remove()
        .catch((err) => {
          debug(`Failed to remove match object: ${err.toString()}`);
        });
    }
    if (sentForEdgeResult instanceof Error) {
      errorLog(`Sent For Edge Failure:${sentForEdgeResult.toString()}`);
      errorMessage += sentForEdgeResult.toString();
    } else {
      const update = {
        $pop: matchmakerMade ? {
          edgeSummaries: 1,
          requestedMatch_ids: 1,
        } : {
          edgeSummaries: 1,
        },
      };
      User.findByIdAndUpdate(sentFor._id, update, { new: true })
        .exec()
        .catch((err) => {
          debug(`Failed to pop user edge: ${err.toString()}`);
        });
    }
    if (receivedByEdgeResult instanceof Error) {
      errorLog(`Received By Edge Failure:${receivedByEdgeResult.toString()}`);
      errorMessage += receivedByEdgeResult.toString();
    } else {
      User.findByIdAndUpdate(receivedBy._id, {
        $pop: {
          edgeSummaries: 1,
          requestedMatch_ids: 1,
        },
      }, { new: true })
        .exec()
        .catch((err) => {
          debug(`Failed to pop user edge: ${err.toString()}`);
        });
    }
    if (createChatResult instanceof Error) {
      errorMessage += createChatResult.toString();
    } else {
      // we don't delete the chat; we just leave it, and no mongo edges/matches reference it
    }
    errorLog(errorMessage);
    return {
      success: false,
      message: SEND_MATCH_REQUEST_ERROR,
    };
  }
  // send server message to the new match object
  sendMatchRequestServerMessage({
    chatID: firebaseId,
    initiator: sentBy,
    hasMatchmaker: matchmakerMade,
  });
  if (matchmakerMade) {
    const endorsementChatId = profile.firebaseChatDocumentID;
    notifyEndorsementChatNewRequest({
      chatID: endorsementChatId,
      sentBy,
      sentFor,
      receivedBy,
    });
    sendMatchSentForPushNotification({
      sentBy,
      sentFor,
    });
  }
  sendMatchReceivedByPushNotification({ receivedBy });
  return {
    success: true,
    match,
  };
};

export const decideOnMatch = async ({ user_id, match_id, decision }) => {
  if (!['reject', 'accept'].includes(decision)) {
    throw new Error(`Unknown match action: ${decision}`);
  }
  const acceptedMatch = decision === 'accept';
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

  // set object field names depending on whether user_id is sentFor or receivedBy in match
  const imSentFor = (user_id === match.sentForUser_id.toString());
  const myStatusKeyName = imSentFor ? 'sentForUserStatus' : 'receivedByUserStatus';
  const theirStatusKeyName = imSentFor ? 'receivedByUserStatus' : 'sentForUserStatus';
  const myStatusLastUpdatedKeyName = imSentFor
    ? 'sentForUserStatusLastUpdated'
    : 'receivedByUserStatusLastUpdated';

  // update my status in the match object
  const previousMyStatus = match[myStatusKeyName];
  const previousMyStatusLastUpdated = match[myStatusLastUpdatedKeyName];
  const matchUpdateObj = {};
  matchUpdateObj[myStatusKeyName] = acceptedMatch ? 'accepted' : 'rejected';
  matchUpdateObj[myStatusLastUpdatedKeyName] = new Date();
  // this throws if it errors, canceling the whole operation
  const matchUpdated = await Match.findByIdAndUpdate(match_id, matchUpdateObj,
    { new: true })
    .exec();

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
  const myEdgeLastUpdated = user.edgeSummaries.find(
    edgeSummary => edgeSummary.match_id.toString() === match_id,
  ).lastStatusChange || new Date();
  const theirEdgeLastUpdated = otherUser.edgeSummaries.find(
    edgeSummary => edgeSummary.match_id.toString() === match_id,
  ).lastStatusChange || new Date();
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
    const rollbackMatchUpdateObj = {};
    rollbackMatchUpdateObj[myStatusKeyName] = previousMyStatus;
    rollbackMatchUpdateObj[myStatusLastUpdatedKeyName] = previousMyStatusLastUpdated;
    Match.findByIdAndUpdate(match_id, rollbackMatchUpdateObj, { new: true }, (err) => {
      if (err) {
        debug(`Failed to rollback match object updates: ${err.toString()}`);
      } else {
        debug('Rolled back match object updates successfully');
      }
    });
    if (mePullRequestUpdate instanceof Error) {
      message += mePullRequestUpdate.toString();
    } else {
      User.findByIdAndUpdate(user_id, {
        $push: {
          requestedMatch_ids: match_id,
        },
      }, { new: true }, (err) => {
        if (err) {
          debug(`Failed to add match id back to user's open requests array: ${err.toString()}`);
        } else {
          debug('Added match id back to user\'s open requests array');
        }
      });
    }
    if (edgeUpdate instanceof Error) {
      message += edgeUpdate.toString();
    } else if (edgeUpdate !== null) {
      // if we made the edge and currentMatch_ids updates, roll those back: remove any instances of
      // match_id from currentMatch_ids of both user documents (if it was a rejected match, there
      // will be none anyway though), and reset the edgeStatus-es
      const myEdgeRollbackInfo = {
        user_id,
        match_id,
        matchesListOp: '$pull',
        rollbackEdgeStatus: 'open',
        rollbackEdgeLastUpdated: myEdgeLastUpdated,
      };
      const theirEdgeRollbackInfo = {
        user_id: otherUser._id,
        match_id,
        matchesListOp: '$pull',
        rollbackEdgeStatus: 'open',
        rollbackEdgeLastUpdated: theirEdgeLastUpdated,
      };
      try {
        rollbackEdgeUpdates([myEdgeRollbackInfo, theirEdgeRollbackInfo]);
      } catch (e) {
        debug(`Failed to rollback edge updates: ${e.toString()}`);
      }
    }
    throw new Error(message);
  }
  if (isAMatch) {
    sendMatchAcceptedServerMessage({ chatID: match.firebaseChatDocumentID });
    sendMatchAcceptedPushNotification({ user, otherUser });
    sendMatchAcceptedPushNotification({ otherUser, user });
    const matchmakerMade = match.sentForUser_id.toString() !== match.sentByUser_id.toString();
    if (matchmakerMade) {
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
      const profile = await UserProfile.findOne({
        user_id: match.sentForUser_id,
        creatorUser_id: match.sentByUser_id,
      });
      notifyEndorsementChatAcceptedRequest({
        chatID: profile.firebaseChatDocumentID,
        sentBy,
        sentFor,
        receivedBy,
      });
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
    }
  }
  return {
    success: true,
    match: matchUpdated,
  };
};
