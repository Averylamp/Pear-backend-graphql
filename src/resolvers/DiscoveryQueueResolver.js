import { User } from '../models/UserModel';
import { DiscoveryQueue, DiscoveryItem } from '../models/DiscoveryQueueModel';

const debug = require('debug')('dev:DiscoveryQueueResolver');


export const resolvers = {
  Query: {
    feed: async (_, { user_id }) => {
      debug(`Getting feed for user with id: ${user_id}`);
      return DiscoveryQueue.findOne({ user_id });
    },
  },
  Mutation: {
    addToQueue: async (_, { user_id, addedUser_id }) => DiscoveryQueue.findOne({ user_id })
      .then((discoveryQueue) => {
        discoveryQueue.currentDiscoveryItems.push(new DiscoveryItem({ user_id: addedUser_id }));
        discoveryQueue.save();
      }).then(() => ({ success: true })),
  },
  DiscoveryQueue: {
    user: async ({ user_id }) => User.findById(user_id),
  },
  DiscoveryItem: {
    user: async ({ user_id }) => User.findById(user_id),
  },
};
