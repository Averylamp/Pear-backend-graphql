import { EventModel } from '../models/EventModel';
import { User } from '../models/UserModel';

const errorLog = require('debug')('error:UserActionResolvers');

export const resolvers = {
  Query: {
    getEventByCode: async (_source, { code }) => EventModel.findOne({ code }).exec(),
    getEventById: async (_source, { event_id }) => EventModel.findById(event_id).exec(),
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
