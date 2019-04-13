import { User } from '../models/UserModel';
import { Match } from '../models/MatchModel';
import {
  createNewMatch, getAndValidateUserAndMatchObjects, decideOnMatch, rollbackEdgeUpdates,
} from '../matching/matching';
import {
  ACCEPT_MATCH_REQUEST_ERROR, REJECT_MATCH_REQUEST_ERROR,
  SEND_MATCH_REQUEST_ERROR, UNMATCH_ERROR,
} from './ResolverErrorStrings';
import { errorStyling } from '../utils/logging';

const debug = require('debug')('dev:MatchResolver');
const errorLogger = require('debug')('error:MatchResolver');
const functionCallLog = require('debug')('dev:FunctionCalls');

const errorLog = log => errorLogger(errorStyling(log));

export const resolvers = {
  Query: {
    match: async (_source, { id }) => {
      debug(`Getting match by id: ${id}`);
      return Match.findById(id);
    },
  },
  Mutation: {
    createMatchRequest: async (_source, { requestInput }) => {
      functionCallLog('Create Match Request');
      try {
        return createNewMatch(requestInput);
      } catch (e) {
        errorLog(`Error while creating match: ${e.toString()}`);
        return {
          success: false,
          message: SEND_MATCH_REQUEST_ERROR,
        };
      }
    },
    acceptRequest: async (_source, { user_id, match_id }) => {
      functionCallLog(`Accept Match Request: ${user_id} -> ${match_id}`);
      try {
        return decideOnMatch({ user_id, match_id, decision: 'accept' });
      } catch (e) {
        errorLog(`Error occurred in accepting request: ${e.toString()}`);
        return {
          success: false,
          message: ACCEPT_MATCH_REQUEST_ERROR,
        };
      }
    },
    rejectRequest: async (_source, { user_id, match_id }) => {
      functionCallLog(`Reject Match Request: ${user_id} -> ${match_id}`);
      try {
        return decideOnMatch({ user_id, match_id, decision: 'reject' });
      } catch (e) {
        errorLog(`Error occurred in rejecting request: ${e.toString()}`);
        return {
          success: false,
          message: REJECT_MATCH_REQUEST_ERROR,
        };
      }
    },
    unmatch: async (_source, { user_id, match_id, reason }) => {
      functionCallLog(`Unmatch Match Request: ${user_id} -> ${match_id}`);
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
          unmatchedTimestamp: new Date(),
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
        ).lastStatusChange || new Date();
        const theirEdgeLastUpdated = otherUser.edgeSummaries.find(
          edgeSummary => edgeSummary.match_id.toString() === match_id,
        ).lastStatusChange || new Date();
        const edgeUpdate = await User.updateMany({
          _id: { $in: [user_id, otherUser._id.toString()] },
        }, {
          $pull: {
            currentMatch_ids: match_id,
          },
          'edgeSummaries.$[element].edgeStatus': 'unmatched',
          'edgeSummaries.$[element].lastStatusChange': new Date(),
        }, {
          arrayFilters: [{ 'element.match_id': match_id }],
        }).exec()
          .catch(err => err);

        // if any errors, roll back
        if (matchUpdate instanceof Error || edgeUpdate instanceof Error) {
          debug('error unmatching; rolling back');
          let errorMessage = '';
          if (matchUpdate instanceof Error) {
            errorMessage += matchUpdate.toString();
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
            errorMessage += edgeUpdate.toString();
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
          errorLog(`Error occurred unmatching: ${errorMessage}`);
          return {
            success: false,
            message: UNMATCH_ERROR,
          };
        }
        return {
          success: true,
          match: matchUpdate,
        };
      } catch (e) {
        errorLog(`Error occurred unmatching: ${e}`);
        return {
          success: false,
          message: UNMATCH_ERROR,
        };
      }
    },
  },
  Match: {
    sentByUser: async ({ sentByUser_id }) => User.findById(sentByUser_id),
    sentForUser: async ({ sentForUser_id }) => User.findById(sentForUser_id),
    receivedByUser: async ({ receivedByUser_id }) => User.findById(receivedByUser_id),
  },
  EdgeSummary: {
    match: async ({ match_id }) => Match.findById(match_id),
  },
};
