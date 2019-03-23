import { User } from '../models/UserModel';
import { Match } from '../models/MatchModel';
import {
  createNewMatch, getAndValidateUserAndMatchObjects, decideOnMatch, rollbackEdgeUpdates,
} from '../matching/matching';

const debug = require('debug')('dev:MatchResolver');
// const errorLogger = require('debug')('error:MatchResolver');
//
// const chalk = require('chalk');
//
// const errorStyling = chalk.red.bold;
//
// const errorLog = log => errorLogger(errorStyling(log));

export const resolvers = {
  Query: {
    match: async (_source, { id }) => {
      debug(`Getting match by id: ${id}`);
      return Match.findById(id);
    },
  },
  Mutation: {
    createMatchRequest: async (_source, { requestInput }) => {
      try {
        return createNewMatch(requestInput);
      } catch (e) {
        return {
          success: false,
          message: e.toString(),
        };
      }
    },
    viewRequest: async (_source, { user_id, match_id }) => {
      try {
        // get and validate user and match objects
        const promisesResult = await getAndValidateUserAndMatchObjects({
          user_id,
          match_id,
          validationType: 'view',
        });
        let match = promisesResult[1];

        // determine whether user is sentFor or receivedBy in the match object, and set key name
        // variables (to be referenced shortly) appropriately
        const imSentFor = (user_id === match.sentForUser_id.toString());
        const myStatusKeyName = imSentFor ? 'sentForUserStatus' : 'receivedByUserStatus';
        const myStatusLastUpdatedKeyName = imSentFor
          ? 'sentForUserStatusLastUpdated'
          : 'receivedByUserStatusLastUpdated';

        // update the user's status (RequestResponse) in the match object
        // no rollback-on-failure needed because this is just one db operation
        if (['unseen', 'seen'].includes(match[myStatusKeyName])) {
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
        return decideOnMatch({ user_id, match_id, decision: 'accept' });
      } catch (e) {
        return {
          success: false,
          message: e.toString(),
        };
      }
    },
    rejectRequest: async (_source, { user_id, match_id }) => {
      try {
        return decideOnMatch({ user_id, match_id, decision: 'reject' });
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
        const promisesResult = await getAndValidateUserAndMatchObjects({
          user_id,
          match_id,
          validationType: 'unmatch',
        });
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
          edgeSummary => edgeSummary.match_id.toString() === match_id,
        ).lastStatusChange || Date();
        const theirEdgeLastUpdated = otherUser.edgeSummaries.find(
          edgeSummary => edgeSummary.match_id.toString() === match_id,
        ).lastStatusChange || Date();
        const edgeUpdate = await User.updateMany({
          _id: { $in: [user_id, otherUser._id.toString()] },
        }, {
          $pull: {
            currentMatch_ids: match_id,
          },
          'edgeSummaries.$[element].edgeStatus': 'unmatched',
          'edgeSummaries.$[element].lastStatusChange': Date(),
        }, {
          arrayFilters: [{ 'element.match_id': match_id }],
        }).exec()
          .catch(err => err);

        // if any errors, roll back
        if (matchUpdate instanceof Error || edgeUpdate instanceof Error) {
          debug('error unmatching; rolling back');
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
