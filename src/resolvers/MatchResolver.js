import nanoid from 'nanoid';
import { addNewEdge, User } from '../models/UserModel';
import { createMatchObject } from '../models/MatchModel';
import { UserProfile } from '../models/UserProfileModel';

const mongoose = require('mongoose');
const debug = require('debug')('dev:MatchResolver');

const makeFirebaseDocumentID = (length = 20) => nanoid(length);

const createNewMatch = async (sentByUser_id, sentForUser_id, receivedByUser_id, matchID) => {
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
  if (sentByUser_id !== sentForUser_id) {
    profilePromise = UserProfile.findOne({
      user_id: sentForUser_id,
      creatorUser_id: sentByUser_id,
    })
      .catch(() => null);
  }
  const [sentBy, sentFor, receivedBy, profile] = await Promise
    .all([sentByPromise, sentForPromise, receivedByPromise, profilePromise]);
  if (!sentBy) {
    return {
      success: false,
      message: `Couldn't find sentBy with id ${sentByUser_id}`,
    };
  }
  if (!sentFor) {
    return {
      success: false,
      message: `Couldn't find sentFor user with id ${sentForUser_id}`,
    };
  }
  if (!receivedBy) {
    return {
      success: false,
      message: `Couldn't find receivedBy user with id ${receivedByUser_id}`,
    };
  }
  if (sentByUser_id !== sentForUser_id && !profile) {
    return {
      success: false,
      message: `Matchmaker ${sentByUser_id} has not made a profile
          for ${sentForUser_id}`,
    };
  }
  const matchInput = {
    _id: matchID,
    sentByUser_id,
    sentForUser_id,
    receivedByUser_id,
    firebaseChatDocumentID: makeFirebaseDocumentID(),
  };
  const matchPromise = createMatchObject(matchInput)
    .catch(err => err);
  const createSentForEdgePromise = addNewEdge(sentFor, receivedBy, matchID);
  const createReceivedByEdgePromise = addNewEdge(receivedBy, sentFor, matchID);

  const [match, sentForEdgeResult, receivedByEdgeResult] = await Promise
    .all([matchPromise, createSentForEdgePromise, createReceivedByEdgePromise]);

  if (match instanceof Error
    || sentForEdgeResult instanceof Error
    || receivedByEdgeResult instanceof Error) {
    let message = '';
    if (matchPromise instanceof Error) {
      message += matchPromise.toString();
    } else {
      match.remove()
        .catch((err) => {
          debug(`Failed to remove match object: ${err}`);
        });
    }
    if (sentForEdgeResult instanceof Error) {
      message += sentForEdgeResult.toString();
    } else {
      User.findByIdAndUpdate(sentFor._id, {
        $pop: {
          edgeSummaries: 1,
        },
      })
        .exec()
        .catch((err) => {
          debug(`Failed to pop user edge: ${err}`);
        });
    }
    if (receivedByEdgeResult instanceof Error) {
      message += receivedByEdgeResult.toString();
    } else {
      User.findByIdAndUpdate(receivedBy._id, {
        $pop: {
          edgeSummaries: 1,
        },
      })
        .exec()
        .catch((err) => {
          debug(`Failed to pop user edge: ${err}`);
        });
    }

    return {
      success: false,
      message,
    };
  }

  return {
    success: true,
    match,
  };
};

export const resolvers = {
  Mutation: {
    matchmakerCreateRequest: async (_source, { requestInput }) => {
      const matchID = '_id' in requestInput ? requestInput._id : mongoose.Types.ObjectId();
      return createNewMatch(
        requestInput.matchmakerUser_id,
        requestInput.sentForUser_id,
        requestInput.receivedByUser_id,
        matchID,
      );
    },
    personalCreateRequest: async (_source, { requestInput }) => {
      const matchID = '_id' in requestInput ? requestInput._id: mongoose.Types.ObjectId();
      return createNewMatch(
        requestInput.sentForUser_id,
        requestInput.sentForUser_id,
        requestInput.receivedByUser_id,
        matchID,
      );
    },
    viewRequest: async () => {},
    acceptRequest: async () => {},
    rejectRequest: async () => {},
    unmatch: async () => {},
  },
  Match: {
    sentByUser: async ({ sentByUser_id }) => User.findById(sentByUser_id),
    sentForUser: async ({ sentForUser_id }) => User.findById(sentForUser_id),
    receivedByUser: async ({ receivedByUser_id }) => User.findById(receivedByUser_id),
  },
};
