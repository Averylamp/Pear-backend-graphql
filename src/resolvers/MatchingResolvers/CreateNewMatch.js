import nanoid from 'nanoid';
import { receiveRequest, sendRequest, User } from '../../models/UserModel';
import {
  GET_USER_ERROR,
  SEND_MATCH_REQUEST_ERROR, USERS_ALREADY_MATCHED_ERROR,
  WRONG_CREATOR_ERROR,
} from '../ResolverErrorStrings';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import {
  createMatchChat,
  getChatDocPathFromId,
  notifyEndorsementChatNewRequest,
  sendMatchmakerRequestMessage,
  sendMatchReceivedByPushNotification,
  sendMatchSentForPushNotification,
  sendPersonalRequestMessage,
} from '../../FirebaseManager';
import { createMatchObject } from '../../models/MatchModel';
import { rollbackObject } from '../../../util/util';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { datadogStats } from '../../DatadogHelper';
import { recordCreateMatch } from '../../models/UserActionModel';

const debug = require('debug')('dev:CreateNewMatch');
const errorLogger = require('debug')('error:CreateNewMatch');

const chalk = require('chalk');

const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));

const mongoose = require('mongoose');

export const createNewMatchResolver = async ({
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
  for (const matchedUser_id in sentFor.edgeSummaries.map(edge => edge.otherUser_id.toString())) {
    if (matchedUser_id.toString() === receivedBy._id.toString()) {
      return {
        success: false,
        message: USERS_ALREADY_MATCHED_ERROR,
      };
    }
  }

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
    .all([sentByDiscoveryPromise, sentForDiscoveryPromise, receivedByDiscoveryPromise]);
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
    datadogStats.increment('server.stats.match_request_matchmaker_sent');
    const endorsementEdges = sentBy.endorsementEdges.filter(
      edge => edge.otherUser_id.toString() === sentFor._id.toString(),
    );
    if (endorsementEdges.length > 0) {
      [endorsementEdge] = endorsementEdges;
    }
  } else {
    datadogStats.increment('server.stats.match_request_personal_sent');
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
  // also increment the pearsSentCount of matchmaker if there is one
  let createSentForEdgePromise = null;
  if (matchmakerMade) {
    createSentForEdgePromise = receiveRequest(sentFor, receivedBy, matchID, true)
      .catch(err => err);
    sentBy.pearsSentCount += 1;
    sentBy.save();
  } else {
    createSentForEdgePromise = sendRequest(sentFor, receivedBy, matchID)
      .catch(err => err);
  }
  const createReceivedByEdgePromise = receiveRequest(receivedBy, sentFor, matchID, false)
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
  sentByDiscovery.decidedDiscoveryItems.push({
    user_id: receivedByUser_id.toString(),
    action: matchmakerMade ? 'pear' : 'match',
  });
  const sentByDiscoveryUpdatePromise = sentByDiscovery.save().catch(err => err);
  sentForDiscovery.currentDiscoveryItems = sentForDiscovery.currentDiscoveryItems
    .filter(item => item.user_id.toString() !== receivedByUser_id.toString());
  const sentForDiscoveryUpdatePromise = matchmakerMade
    ? sentForDiscovery.save().catch(err => err)
    : Promise.resolve(null);
  receivedByDiscovery.currentDiscoveryItems = receivedByDiscovery.currentDiscoveryItems
    .filter(item => item.user_id.toString() !== sentForUser_id.toString());
  const receivedByDiscoveryUpdatePromise = receivedByDiscovery.save().catch(err => err);

  const [match,
    sentForEdgeResult,
    receivedByEdgeResult,
    createChatResult,
    sentByDiscoveryResult,
    sentForDiscoveryResult,
    receivedByDiscoveryResult] = await Promise.all([matchPromise,
    createSentForEdgePromise,
    createReceivedByEdgePromise,
    createChatPromise,
    sentByDiscoveryUpdatePromise,
    sentForDiscoveryUpdatePromise,
    receivedByDiscoveryUpdatePromise]);

  // rollbacks if any updates failed
  if (match instanceof Error
    || sentForEdgeResult instanceof Error
    || receivedByEdgeResult instanceof Error
    || createChatResult instanceof Error
    || sentByDiscoveryResult instanceof Error
    || sentForDiscoveryResult instanceof Error
    || receivedByDiscoveryResult instanceof Error) {
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
    if (sentByDiscoveryResult instanceof Error) {
      errorLog(`Sent By discovery edge failure: ${sentByDiscoveryResult}`);
      errorMessage += sentByDiscoveryResult.toString();
    }
    if (sentForDiscoveryResult instanceof Error) {
      errorLog(`Sent For discovery edge failure: ${sentForDiscoveryResult}`);
      errorMessage += sentForDiscoveryResult.toString();
    }
    if (receivedByDiscoveryResult instanceof Error) {
      errorLog(`Received By discovery edge failure: ${receivedByDiscoveryResult}`);
      errorMessage += receivedByDiscoveryResult.toString();
    }
    await rollbackObject({
      model: User,
      object_id: sentFor._id,
      initialObject: initialSentFor,
      onSuccess: () => { debug('rolled back sentFor user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back sentFor user object: ${err}`); },
    });
    await rollbackObject({
      model: User,
      object_id: receivedBy._id,
      initialObject: initialReceivedBy,
      onSuccess: () => { debug('rolled back receivedBy user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back receivedBy user object: ${err}`); },
    });
    await rollbackObject({
      model: DiscoveryQueue,
      object_id: sentByDiscovery._id,
      initialObject: initialSentByDiscovery,
      onSuccess: () => { debug('rolled back sentBy discovery object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back sentBy discovery object: ${err}`); },
    });
    if (matchmakerMade) {
      await rollbackObject({
        model: DiscoveryQueue,
        object_id: sentForDiscovery._id,
        initialObject: initialSentForDiscovery,
        onSuccess: () => { debug('rolled back sentFor discovery object successfully'); },
        onFailure: (err) => { errorLog(`error rolling back sentFor discovery object: ${err}`); },
      });
    }
    await rollbackObject({
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
  // send push notifications
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
  recordCreateMatch({
    sentByUser_id, sentForUser_id, receivedByUser_id, match_id: match._id,
  });
  return {
    success: true,
    match,
  };
};
