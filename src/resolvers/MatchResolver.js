import nanoid from 'nanoid';
import { receiveRequest, sendRequest, User } from '../models/UserModel';
import { createMatchObject, Match } from '../models/MatchModel';
import { UserProfile } from '../models/UserProfileModel';

const mongoose = require('mongoose');
const debug = require('debug')('dev:MatchResolver');

const makeFirebaseDocumentID = (length = 20) => nanoid(length);

// utility function for rolling back a specific db operation on unsuccessful unmatches and
// accept/reject ops
const rollbackEdgeUpdates = (rollbackSummary) => {
  for (const rollbackItem of rollbackSummary) {
    const updateObj = {
      'edgeSummaries.$[element].edgeStatus': rollbackItem.rollbackEdgeStatus,
      'edgeSummaries.$[element].lastStatusChange': rollbackItem.rollbackEdgeLastUpdtaed,
    };
    updateObj[rollbackItem.matchesListOp] = {
      currentMatch_ids: rollbackItem.match_id,
    };
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

const getAndValidateUserAndMatchObjects = async (user_id, match_id, validationType) => {
  const userPromise = User.findById(user_id)
    .exec()
    .catch(() => null);
  const matchPromise = Match.findById(match_id)
    .exec()
    .catch(() => null);
  const [user, match] = await Promise.all([userPromise, matchPromise]);
  if (!user) {
    throw new Error(`Couldn't find user with id ${user_id}`);
  }
  if (!match) {
    throw new Error(`Couldn't find match with id ${match_id}`);
  }
  let otherUser_id = null;
  if (user_id === match.sentForUser_id) {
    otherUser_id = match.receivedByUser_id;
  } else if (user_id === match.receivedByUser_id) {
    otherUser_id = match.sentForUser_id;
  } else {
    throw new Error(`User ${user_id} is not a part of match ${match_id}`);
  }
  const otherUser = await User.findById(otherUser_id);
  if (!otherUser) {
    throw new Error(`Couldn't find user's match partner with id ${otherUser_id}`);
  }
  if (['reject', 'accept'].contains(validationType)) {
    if (user_id === match.sentForUser_id) {
      if (['rejected', 'accepted'].contains(match.sentForUserStatus)) {
        throw new Error(`User ${user_id} has already taken action on request ${match_id}`);
      }
    } else if (user_id === match.receivedByUser_id) {
      if (['rejected', 'accepted'].contains(match.receivedByUserStatus)) {
        throw new Error(`User ${user_id} has already taken action on request ${match_id}`);
      }
    }
  }
  if (validationType === 'unmatch') {
    if (match.sentForUserStatus !== 'accepted' || match.receivedByUserStatus !== 'accepted') {
      throw new Error('This request was not mutually accepted');
    }
  }
  return [user, match, otherUser];
};

const createNewMatch = async (sentByUser_id, sentForUser_id, receivedByUser_id, matchID) => {
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

  // create the match object
  const matchInput = {
    _id: matchID,
    sentByUser_id,
    sentForUser_id,
    receivedByUser_id,
    firebaseChatDocumentID: makeFirebaseDocumentID(),
  };
  if (!matchmakerMade) {
    matchInput.sentForUserStatus = 'accepted';
  }
  const matchPromise = createMatchObject(matchInput)
    .catch(err => err);

  // add edges and push to requestedMatch_ids via operations on the user model
  const sentForUserModelUpdateFn = matchmakerMade ? receiveRequest : sendRequest;
  const createSentForEdgePromise = sentForUserModelUpdateFn(sentFor, receivedBy, matchID);
  const createReceivedByEdgePromise = receiveRequest(receivedBy, sentFor, matchID);

  const [match, sentForEdgeResult, receivedByEdgeResult] = await Promise
    .all([matchPromise, createSentForEdgePromise, createReceivedByEdgePromise]);

  // rollbacks if any updates failed
  if (match instanceof Error
    || sentForEdgeResult instanceof Error
    || receivedByEdgeResult instanceof Error) {
    let message = '';
    if (matchPromise instanceof Error) {
      message += matchPromise.toString();
    } else {
      match.remove()
        .catch((err) => {
          debug(`Failed to remove match object: ${err.toString()}`);
        });
    }
    if (sentForEdgeResult instanceof Error) {
      message += sentForEdgeResult.toString();
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
      message += receivedByEdgeResult.toString();
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

const decideOnMatch = async (user_id, match_id, decision) => {
  if (!['reject', 'accept'].contains(decision)) {
    throw new Error(`Unknown match action: ${decision}`);
  }
  const acceptedMatch = decision === 'accept';
  // verifies that user exists, match exists, user is part of match, user hasn't yet taken
  // accept/reject action onmatch
  const promisesResult = await getAndValidateUserAndMatchObjects(user_id, match_id, decision);
  const user = promisesResult[0];
  const match = promisesResult[1];
  const otherUser = promisesResult[2];

  // set object field names depending on whether user_id is sentFor or receivedBy in match
  const imSentFor = (user_id === match.sentForUser_id);
  const myStatusKeyName = imSentFor ? 'sentForUserStatus' : 'receivedByUserStatus';
  const theirStatusKeyName = imSentFor ? 'receivedByUserStatus' : 'sentForUserStatus';
  const myStatusLastUpdatedKeyName = imSentFor
    ? 'sentForUserStatusLastUpdated'
    : 'receivedByUserStatusLastUpdated';

  // update my status in the match object
  const previousMyStatus = match[myStatusKeyName];
  const previousMyStatusLastUpdated = match[myStatusLastUpdatedKeyName];
  const matchUpdateObj = {};
  matchUpdateObj[myStatusKeyName] = acceptedMatch ? 'accept' : 'reject';
  matchUpdateObj[myStatusLastUpdatedKeyName] = Date();
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
  const theirMatchStatus = matchUpdated[theirStatusKeyName];
  const myEdgeLastUpdated = user.edgeSummaries.find(
    edgeSummary => edgeSummary.match_id === match_id,
  ) || Date();
  const theirEdgeLastUpdated = otherUser.edgeSummaries.find(
    edgeSummary => edgeSummary.match_id === match_id,
  ) || Date();
  if (['accepted', 'rejected'].contains(theirMatchStatus)) {
    if (theirMatchStatus === 'accepted' && acceptedMatch) {
      edgeUpdate = await User.updateMany({}, {
        $push: {
          currentMatch_ids: match_id,
        },
        'edgeSummaries.$[element].edgeStatus': 'match',
        'edgeSummaries.$[element].lastStatusChange': Date(),
      }, {
        arrayFilters: [{ 'element.match_id': match_id }],
      }.exec()
        .catch(err => err));
    } else {
      edgeUpdate = await User.updateMany({}, {
        'edgeSummaries.$[element].edgeStatus': 'rejected',
        'edgeSummaries.$[element].lastStatusChange': Date(),
      }, {
        arrayFilters: [{ 'element.match_id': match_id }],
      }.exec()
        .catch(err => err));
    }
  }

  // roll back if any update failed
  if (mePullRequestUpdate instanceof Error || edgeUpdate instanceof Error) {
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
  return {
    success: true,
    match: matchUpdated,
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
      const matchID = '_id' in requestInput ? requestInput._id : mongoose.Types.ObjectId();
      return createNewMatch(
        requestInput.sentForUser_id,
        requestInput.sentForUser_id,
        requestInput.receivedByUser_id,
        matchID,
      );
    },
    viewRequest: async (_source, { user_id, match_id }) => {
      try {
        // get and validate user and match objects
        const promisesResult = await getAndValidateUserAndMatchObjects(user_id, match_id, 'view');
        let match = promisesResult[1];

        // determine whether user is sentFor or receivedBy in the match object, and set key name
        // variables (to be referenced shortly) appropriately
        const imSentFor = (user_id === match.sentForUser_id);
        const myStatusKeyName = imSentFor ? 'sentForUserStatus' : 'receivedByUserStatus';
        const myStatusLastUpdatedKeyName = imSentFor
          ? 'sentForUserStatusLastUpdated'
          : 'receivedByUserStatusLastUpdated';

        // update the user's status (RequestResponse) in the match object
        // no rollback-on-failure needed because this is just one db operation
        if (['unseen', 'seen'].contains(match[myStatusKeyName])) {
          const updateObj = {};
          updateObj[myStatusKeyName] = 'seen';
          updateObj[myStatusLastUpdatedKeyName] = Date();
          match = await Match.findByIdAndUpdate(match_id, updateObj, { new: true })
            .exec()
            .catch(err => err);
          return (match instanceof Error) ? {
            success: false,
            message: match.toString(),
          } : {
            success: true,
            match,
          };
        }
        return {
          success: false,
          message: 'This request has already been accepted or rejected',
        };
      } catch (e) {
        return {
          success: false,
          message: `Error: ${e.toString()}`,
        };
      }
    },
    acceptRequest: async (_source, { user_id, match_id }) => {
      try {
        return decideOnMatch(user_id, match_id, 'accept');
      } catch (e) {
        return {
          success: false,
          message: e.toString(),
        };
      }
    },
    rejectRequest: async (_source, { user_id, match_id }) => {
      try {
        return decideOnMatch(user_id, match_id, 'reject');
      } catch (e) {
        return {
          success: false,
          message: e.toString(),
        };
      }
    },
    unmatch: async (_source, { user_id, match_id, reason }) => {
      try {
        // get and validate user and match objects
        const promisesResult = await getAndValidateUserAndMatchObjects(user_id, match_id, 'unmatch');
        const user = promisesResult[0];
        const otherUser = promisesResult[2];

        // update the match object
        const matchUpdateObj = {
          unmatched: true,
          unmatchedBy_id: user_id,
          unmatchedTimestamp: Date(),
        };
        if (reason) {
          matchUpdateObj.unmatchedReason = reason;
        }
        const matchUpdate = await Match.findByIdAndUpdate(match_id, matchUpdateObj, { new: true })
          .exec()
          .catch(err => err);

        // update the user objects: currentMatch_ids list, and edges
        const myEdgeLastUpdated = user.edgeSummaries.find(
          edgeSummary => edgeSummary.match_id === match_id,
        ) || Date();
        const theirEdgeLastUpdated = otherUser.edgeSummaries.find(
          edgeSummary => edgeSummary.match_id === match_id,
        ) || Date();
        const edgeUpdate = await User.updateMany({}, {
          $pull: {
            currentMatch_ids: match_id,
          },
          'edgeSummaries.$[element].edgeStatus': 'unmatched',
          'edgeSummaries.$[element].lastStatusChange': Date(),
        }, {
          arrayFilters: [{ 'element.match_id': match_id }],
        }.exec()
          .catch(err => err));

        // if any errors, roll back
        if (matchUpdate instanceof Error || edgeUpdate instanceof Error) {
          let message = '';
          if (matchUpdate instanceof Error) {
            message += matchUpdate.toString();
          } else {
            Match.findByIdAndUpdate(match_id, {
              unmatched: false,
              $unset: {
                unmatchedBy_id: '',
                unmatchedTimestamp: '',
                unmatchedReason: '',
              },
            }, { new: true }, (err) => {
              if (err) {
                debug(`Failed to roll back match object: ${err.toString()}`);
              } else {
                debug('Successfully rolled back match object');
              }
            });
          }
          if (edgeUpdate instanceof Error) {
            message += edgeUpdate.toString();
          } else {
            // if we made the edge and currentMatch_ids updates, roll those back: re-add the match
            // to currentMatch_ids, and revert edge statuses from unmatched to match
            const myEdgeRollbackInfo = {
              user_id,
              match_id,
              matchesListOp: '$push',
              rollbackEdgeStatus: 'match',
              rollbackEdgeLastUpdated: myEdgeLastUpdated,
            };
            const theirEdgeRollbackInfo = {
              user_id: otherUser._id,
              match_id,
              matchesListOp: '$push',
              rollbackEdgeStatus: 'match',
              rollbackEdgeLastUpdated: theirEdgeLastUpdated,
            };
            try {
              rollbackEdgeUpdates([myEdgeRollbackInfo, theirEdgeRollbackInfo]);
            } catch (e) {
              debug(`Failed to rollback edge updates: ${e.toString()}`);
            }
          }
          return {
            success: false,
            message,
          };
        }
        return {
          success: true,
          match: matchUpdate,
        };
      } catch (e) {
        return {
          success: false,
          message: e.toString(),
        };
      }
    },
  },
  Match: {
    sentByUser: async ({ sentByUser_id }) => User.findById(sentByUser_id),
    sentForUser: async ({ sentForUser_id }) => User.findById(sentForUser_id),
    receivedByUser: async ({ receivedByUser_id }) => User.findById(receivedByUser_id),
  },
};
