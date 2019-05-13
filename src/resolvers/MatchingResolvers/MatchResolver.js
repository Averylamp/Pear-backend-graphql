import { User } from '../../models/UserModel';
import { Match } from '../../models/MatchModel';
import {
  ACCEPT_MATCH_REQUEST_ERROR, REJECT_MATCH_REQUEST_ERROR,
  SEND_MATCH_REQUEST_ERROR, UNMATCH_ERROR,
} from '../ResolverErrorStrings';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { createNewMatchResolver } from './CreateNewMatch';
import { unmatchResolver } from './Unmatch';
import { decideOnMatchResolver } from './DecideOnMatch';

const debug = require('debug')('dev:MatchResolver');
const errorLogger = require('debug')('error:MatchResolver');
const chalk = require('chalk');

const errorStyling = chalk.red.bold;
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
        errorLog(`Error while creating match: ${e}`);
        return {
          success: false,
          message: SEND_MATCH_REQUEST_ERROR,
        };
      }
    },
    acceptRequest: async (_source, { user_id, match_id }) => {
      try {
        return decideOnMatchResolver({ user_id, match_id, decision: 'accept' });
      } catch (e) {
        errorLog(`Error occurred in accepting request: ${e}`);
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
        return decideOnMatchResolver({ user_id, match_id, decision: 'reject' });
      } catch (e) {
        errorLog(`Error occurred in rejecting request: ${e}`);
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
        return unmatchResolver({ user_id, match_id, reason });
      } catch (e) {
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'unmatch',
          args: { user_id, match_id, reason },
          errorMsg: e,
          errorName: UNMATCH_ERROR,
        });
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
