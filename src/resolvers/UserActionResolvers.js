import { EventModel } from '../models/EventModel';
import { User } from '../models/UserModel';
import { recordAction } from '../models/UserActionModel';
import { COULDNT_RECORD_ACTION } from './ResolverErrorStrings';
import { generateSentryErrorForResolver } from '../SentryHelper';

const errorLog = require('debug')('error:UserActionResolvers');

export const resolvers = {
  Query: {
    getEventByCode: async (_source, { code }) => EventModel.findOne({ code }).exec(),
    getEventById: async (_source, { event_id }) => EventModel.findById(event_id).exec(),
  },
  Mutation: {
    recordCustomAction: async (_source, { userActionInput }) => {
      try {
        const {
          user_id,
          actor_id,
          user_ids,
          description,
          actionType,
        } = userActionInput;
        const action = {
          actor_id,
          user_ids,
          description,
          actionType,
          timestamp: new Date(),
        };
        const actionRes = await recordAction({
          user_id,
          action,
        });
        if (!actionRes) {
          return {
            success: true, // don't alert error on client
            message: COULDNT_RECORD_ACTION,
          };
        }
        return {
          success: true,
          action: actionRes,
        };
      } catch (e) {
        errorLog(`error occurred while creating user: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'recordCustomAction',
          args: { userActionInput },
          errorMsg: e,
          errorName: COULDNT_RECORD_ACTION,
        });
        return {
          success: true, // don't alert error on client
          message: COULDNT_RECORD_ACTION,
        };
      }
    },
  },
  UserActionSummary: {
    user: async ({ user_id }) => User.findById(user_id),
    actions: async ({ actions }) => {
      actions.sort((a, b) => b.timestamp - a.timestamp);
      return actions;
    },
  },
  UserAction: {
    actor: async ({ actor_id }) => User.findById(actor_id),
    users: async ({ user_ids }) => (
      Promise.all(user_ids.map(user_id => User.findById(user_id))).catch((err) => {
        errorLog(`error recording user action ${err}`);
        return [];
      })
    ),
  },
};
