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
    addToQueue: async (_, { user_id, addedUser_id }) => DiscoveryQueue
      .findOneAndUpdate({ user_id }, {
        $push: {
          currentDiscoveryItems: new DiscoveryItem({ user_id: addedUser_id }),
        },
      })
      .then(() => ({ success: true, message: 'Successfully added to queue.' }))
      .catch(err => ({ success: false, message: err.toString() })),
  },
  DiscoveryQueue: {
    user: async ({ user_id }) => User.findById(user_id),
    currentDiscoveryItems: async () => {
      const users = await User.find({ $where: 'this.profile_ids.length > 0' });
      return users.map(({ _id }) => new DiscoveryItem({ user_id: _id }));
    },
  },
  DiscoveryItem: {
    user: async ({ user_id }) => User.findById(user_id),
  },
};
