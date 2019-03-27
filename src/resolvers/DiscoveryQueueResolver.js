import { User } from '../models/UserModel';
import { DiscoveryQueue, DiscoveryItem } from '../models/DiscoveryQueueModel';
import { updateDiscoveryForUserById } from '../discovery/DiscoverProfile';
import { FORCE_FEED_UPDATE_ERROR, FORCE_FEED_UPDATE_SUCCESS } from './ResolverErrorStrings';

const debug = require('debug')('dev:DiscoveryQueueResolver');
const errorLog = require('debug')('error:DiscoveryQueueResolver');


export const resolvers = {
  Query: {
    getDiscoveryFeed: async (_, { user_id }) => {
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
    forceUpdateFeed: async (_, { user_id, numberOfItems = 1 }) => {
      for (let i = 0; i < numberOfItems; i += 1) {
        try {
          await updateDiscoveryForUserById({ user_id });
        } catch (e) {
          errorLog(`An error occurred: ${e}`);
          return {
            success: false,
            message: FORCE_FEED_UPDATE_ERROR,
          };
        }
      }
      return {
        success: true,
        message: FORCE_FEED_UPDATE_SUCCESS,
      };
    },
  },
  DiscoveryQueue: {
    user: async ({ user_id }) => User.findById(user_id),
    currentDiscoveryItems: async () => {
      const users = await User.find({
        $where: 'this.profile_ids.length > 0',
      }).sort({ createdAt: -1 }).exec();
      return users.map(({ _id }) => new DiscoveryItem({ user_id: _id }));
    },
  },
  DiscoveryItem: {
    user: async ({ user_id }) => User.findById(user_id),
  },
};
