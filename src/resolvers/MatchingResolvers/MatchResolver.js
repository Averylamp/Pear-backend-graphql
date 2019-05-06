import { User } from '../../models/UserModel';
import { Match } from '../../models/MatchModel';
import {
  getAndValidateUserAndMatchObjects, decideOnMatch, rollbackEdgeUpdates,
} from '../../matching/matching';
import {
  ACCEPT_MATCH_REQUEST_ERROR, REJECT_MATCH_REQUEST_ERROR,
  SEND_MATCH_REQUEST_ERROR, SKIP_DISCOVERY_ITEM_ERROR, UNMATCH_ERROR,
} from '../ResolverErrorStrings';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { createNewMatchResolver } from './CreateNewMatch';
import { skipDiscoveryItemResolver } from './SkipDiscoveryItem';

const debug = require('debug')('dev:MatchResolver');
const errorLogger = require('debug')('error:MatchResolver');
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
    skipDiscoveryItem: async (_source, { user_id, discoveryFeed_id, discoveryItem_id }) => {
      try {
        return skipDiscoveryItemResolver({ user_id, discoveryFeed_id, discoveryItem_id });
      } catch (e) {
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'skipDiscoveryItem',
          args: { user_id, discoveryFeed_id, discoveryItem_id },
          errorMsg: e,
          errorName: SKIP_DISCOVERY_ITEM_ERROR,
        });
        errorLogger(`Error while skipping discovery item: ${e}`);
        return {
          success: false,
          message: SKIP_DISCOVERY_ITEM_ERROR,
        };
      }
    },
    createMatchRequest: async (_source, { requestInput }) => {
      try {
        return createNewMatchResolver(requestInput);
      } catch (e) {
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'createMatchRequest',
          args: { requestInput },
          errorMsg: e,
          errorName: SEND_MATCH_REQUEST_ERROR,
        });
        errorLogger(`Error while creating match: ${e}`);
        return {
          success: false,
          message: SEND_MATCH_REQUEST_ERROR,
        };
      }
    },
    acceptRequest: async (_source, { user_id, match_id }) => {
      try {
        return decideOnMatch({ user_id, match_id, decision: 'accept' });
      } catch (e) {
        errorLogger(`Error occurred in accepting request: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'acceptRequest',
          args: { user_id, match_id },
          errorMsg: e,
          errorName: ACCEPT_MATCH_REQUEST_ERROR,
        });
        return {
          success: false,
          message: ACCEPT_MATCH_REQUEST_ERROR,
        };
      }
    },
    rejectRequest: async (_source, { user_id, match_id }) => {
      try {
        return decideOnMatch({ user_id, match_id, decision: 'reject' });
      } catch (e) {
        errorLogger(`Error occurred in rejecting request: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'rejectRequest',
          args: { user_id, match_id },
          errorMsg: e,
          errorName: REJECT_MATCH_REQUEST_ERROR,
        });
        return {
          success: false,
          message: REJECT_MATCH_REQUEST_ERROR,
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
          errorLogger(`Error occurred unmatching: ${errorMessage}`);
          generateSentryErrorForResolver({
            resolverType: 'mutation',
            routeName: 'unmatch',
            args: { user_id, match_id, reason },
            errorMsg: errorMessage,
            errorName: UNMATCH_ERROR,
          });
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
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'unmatch',
          args: { user_id, match_id, reason },
          errorMsg: e,
          errorName: UNMATCH_ERROR,
        });
        errorLogger(`Error occurred unmatching: ${e}`);
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
