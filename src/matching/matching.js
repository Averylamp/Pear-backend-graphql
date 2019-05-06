import nanoid from 'nanoid';
import { receiveRequest, sendRequest, User } from '../models/UserModel';
import { createMatchObject, Match } from '../models/MatchModel';
import {
  createMatchChat,
  getChatDocPathFromId,
  notifyEndorsementChatAcceptedRequest,
  notifyEndorsementChatNewRequest,
  sendMatchAcceptedMatchmakerPushNotification,
  sendMatchAcceptedPushNotification,
  sendMatchAcceptedServerMessage, sendMatchmakerRequestMessage,
  sendMatchReceivedByPushNotification,
  sendMatchSentForPushNotification, sendPersonalRequestMessage,
} from '../FirebaseManager';
import {
  GET_USER_ERROR,
  SEND_MATCH_REQUEST_ERROR, USERS_ALREADY_MATCHED_ERROR,
  WRONG_CREATOR_ERROR,
} from '../resolvers/ResolverErrorStrings';
import { generateSentryErrorForResolver } from '../SentryHelper';
import { DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { rollbackObject } from '../../util/util';

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
  sentByUser_id, sentForUser_id, receivedByUser_id, _id = mongoose.Types.ObjectId(), requestText,
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
  const [sentBy, sentFor, receivedBy] = await Promise
    .all([sentByPromise, sentForPromise, receivedByPromise]);
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
  if (matchmakerMade && !(sentFor.endorser_ids.map(endorser_id => endorser_id.toString())
    .includes(sentBy._id.toString()))) {
    errorLog(`Matchmaker ${sentByUser_id} has not endorsed
        for ${sentForUser_id}`);
    return {
      success: false,
      message: WRONG_CREATOR_ERROR,
    };
  }
  const initialSentFor = sentFor.toObject();
  const initialReceivedBy = receivedBy.toObject();

  const sentForDiscoveryPromise = DiscoveryQueue.findOne({ user_id: sentForUser_id })
    .exec()
    .catch(() => null);
  const sentByDiscoveryPromise = DiscoveryQueue.findOne({ user_id: sentByUser_id })
    .exec()
    .catch(() => null);
  const receivedByDiscoveryPromise = DiscoveryQueue.findOne({ user_id: receivedByUser_id })
    .exec()
    .catch(() => null);
  const [sentByDiscovery, sentForDiscovery, receivedByDiscovery] = await Promise
    .all([sentForDiscoveryPromise, sentByDiscoveryPromise, receivedByDiscoveryPromise]);
  if (!sentByDiscovery) {
    errorLog(`Couldn't find discovery queue for user with id ${sentByUser_id}`);
    return {
      success: false,
      message: SEND_MATCH_REQUEST_ERROR,
    };
  }
  if (!sentForDiscovery) {
    errorLog(`Couldn't find discovery queue for user with id ${sentForUser_id}`);
    return {
      success: false,
      message: SEND_MATCH_REQUEST_ERROR,
    };
  }
  if (!receivedByDiscovery) {
    errorLog(`Couldn't find discovery queue for user with id ${receivedByUser_id}`);
    return {
      success: false,
      message: SEND_MATCH_REQUEST_ERROR,
    };
  }
  const initialSentByDiscovery = sentByDiscovery.toObject();
  const initialSentForDiscovery = sentForDiscovery.toObject();
  const initialReceivedByDiscovery = receivedByDiscovery.toObject();

  let endorsementEdge = null;
  if (matchmakerMade) {
    const endorsementEdges = sentBy.endorsementEdges.filter(
      edge => edge.otherUser_id.toString() === sentFor._id.toString(),
    );
    if (endorsementEdges.length > 0) {
      [endorsementEdge] = endorsementEdges;
    }
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

  // update discovery queues
  sentByDiscovery.currentDiscoveryItems = sentByDiscovery.currentDiscoveryItems
    .filter(item => item.user_id.toString() !== receivedByUser_id.toString());
  const sentByDiscoveryUpdatePromise = sentByDiscovery.save().catch(err => err);
  sentForDiscovery.currentDiscoveryItems = sentForDiscovery.currentDiscoveryItems
    .filter(item => item.user_id.toString() !== receivedByUser_id.toString());
  const sentForDiscoveryUpdatePromise = sentForDiscovery.save().catch(err => err);
  receivedByDiscovery.currentDiscoveryItems = receivedByDiscovery.currentDiscoveryItems
    .filter(item => item.user_id.toString() !== sentForUser_id.toString());
  const receivedByDiscoveryUpdatePromise = receivedByDiscovery.save().catch(err => err);

  const [match, sentForEdgeResult, receivedByEdgeResult, createChatResult] = await Promise
    .all([matchPromise, createSentForEdgePromise, createReceivedByEdgePromise, createChatPromise]);

  // rollbacks if any updates failed
  if (match instanceof Error
    || sentForEdgeResult instanceof Error
    || receivedByEdgeResult instanceof Error
    || createChatResult instanceof Error
    || sentByDiscoveryUpdatePromise instanceof Error
    || sentForDiscoveryUpdatePromise instanceof Error
    || receivedByDiscoveryUpdatePromise instanceof Error) {
    let errorMessage = '';
    let responseMessage = SEND_MATCH_REQUEST_ERROR;
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
      if (sentForEdgeResult.toString() === (new Error(USERS_ALREADY_MATCHED_ERROR)).toString()) {
        responseMessage = USERS_ALREADY_MATCHED_ERROR;
      }
    }
    if (receivedByEdgeResult instanceof Error) {
      errorLog(`Received By Edge Failure:${receivedByEdgeResult.toString()}`);
      errorMessage += receivedByEdgeResult.toString();
      if (receivedByEdgeResult.toString() === (new Error(USERS_ALREADY_MATCHED_ERROR)).toString()) {
        responseMessage = USERS_ALREADY_MATCHED_ERROR;
      }
    }
    if (createChatResult instanceof Error) {
      errorMessage += createChatResult.toString();
    } else {
      // we don't delete the chat; we just leave it, and no mongo edges/matches reference it
    }
    if (sentByDiscoveryUpdatePromise instanceof Error) {
      errorMessage += sentByDiscoveryUpdatePromise.toString();
    }
    if (sentForDiscoveryUpdatePromise instanceof Error) {
      errorMessage += sentForDiscoveryUpdatePromise.toString();
    }
    if (receivedByDiscoveryUpdatePromise instanceof Error) {
      errorMessage += receivedByDiscoveryUpdatePromise.toString();
    }
    rollbackObject({
      model: User,
      object_id: sentFor._id,
      initialObject: initialSentFor,
      onSuccess: () => { debug('rolled back sentFor user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back sentFor user object: ${err}`); },
    });
    rollbackObject({
      model: User,
      object_id: receivedBy._id,
      initialObject: initialReceivedBy,
      onSuccess: () => { debug('rolled back receivedBy user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back receivedBy user object: ${err}`); },
    });
    rollbackObject({
      model: DiscoveryQueue,
      object_id: sentByDiscovery._id,
      initialObject: initialSentByDiscovery,
      onSuccess: () => { debug('rolled back sentBy discovery object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back sentBy discovery object: ${err}`); },
    });
    rollbackObject({
      model: DiscoveryQueue,
      object_id: sentForDiscovery._id,
      initialObject: initialSentForDiscovery,
      onSuccess: () => { debug('rolled back sentFor discovery object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back sentFor discovery object: ${err}`); },
    });
    rollbackObject({
      model: DiscoveryQueue,
      object_id: receivedByDiscovery._id,
      initialObject: initialReceivedByDiscovery,
      onSuccess: () => { debug('rolled back receivedBy discovery object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back receivedBy discovery object: ${err}`); },
    });
    errorLog(errorMessage);
    generateSentryErrorForResolver({
      resolverType: 'mutation',
      routeName: 'createMatchRequest',
      args: {
        sentByUser_id,
        sentForUser_id,
        receivedByUser_id,
        _id,
        requestText,
      },
      errorMsg: errorMessage,
      errorName: SEND_MATCH_REQUEST_ERROR,
    });
    return {
      success: false,
      message: responseMessage,
    };
  }
  if (matchmakerMade) {
    sendMatchmakerRequestMessage({
      chatID: firebaseId,
      sentBy,
      requestText: requestText || '',
    });
    if (endorsementEdge) {
      const endorsementChatId = endorsementEdge.firebaseChatDocumentID;
      notifyEndorsementChatNewRequest({
        chatID: endorsementChatId,
        sentBy,
        sentFor,
        receivedBy,
      });
    }
    sendMatchSentForPushNotification({
      sentBy,
      sentFor,
    });
  } else {
    sendPersonalRequestMessage({
      chatID: firebaseId,
      sentBy,
      requestText: requestText || '',
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
    User.findByIdAndUpdate(user_id, initialUser, {
      new: true,
      overwrite: true,
    }).exec()
      .then(() => {
        debug('rolled back me user object successfully');
      })
      .catch((err) => {
        errorLog(`error rolling back me user object: ${err}`);
      });
    User.findByIdAndUpdate(otherUser._id.toString(), initialOtherUser, {
      new: true,
      overwrite: true,
    }).exec()
      .then(() => {
        debug('rolled back other user object successfully');
      })
      .catch((err) => {
        errorLog(`error rolling back other user object: ${err}`);
      });
    Match.findByIdAndUpdate(match_id, initialMatch, {
      new: true,
      overwrite: true,
    }).exec()
      .then(() => {
        debug('rolled back match object successfully');
      })
      .catch((err) => {
        errorLog(`error rolling back match object: ${err}`);
      });
    return {
      success: true,
      message,
    };
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
    }
  }
  return {
    success: true,
    match: matchUpdated,
  };
};
