import { User } from '../models/UserModel';
import { DiscoveryQueue, DiscoveryItem } from '../models/DiscoveryQueueModel';
import {
  updateDiscoveryForUserById,
} from '../discovery/DiscoverProfile';
import {
  FORCE_FEED_UPDATE_ERROR,
  FORCE_FEED_UPDATE_SUCCESS,
} from './ResolverErrorStrings';
import { generateSentryErrorForResolver } from '../SentryHelper';

const mongoose = require('mongoose');
const debug = require('debug')('dev:DiscoveryQueueResolver');
const errorLog = require('debug')('error:DiscoveryQueueResolver');

const devMode = process.env.DEV === 'true';

export const resolvers = {
  Query: {
    getDiscoveryFeed: async (_, { user_id }) => {
      debug(`Getting feed for user with id: ${user_id}`);
      return DiscoveryQueue.findOne({ user_id });
    },
  },
  Mutation: {
    addToQueue: async (_, { user_id, addedUser_id, item_id }) => {
      try {
        const discoveryItem_id = (item_id !== undefined) ? item_id : mongoose.Types.ObjectId();
        const discoveryItem = new DiscoveryItem({
          _id: discoveryItem_id,
          user_id: addedUser_id,
        });
        await DiscoveryQueue.findOneAndUpdate({ user_id }, {
          $push: {
            currentDiscoveryItems: discoveryItem,
            historyDiscoveryItems: discoveryItem,
          },
        });
        return {
          success: true,
          message: 'Successfully added to queue.',
        };
      } catch (e) {
        return {
          success: false,
          message: e.toString(),
        };
      }
    },
    forceUpdateFeed: async (_, { user_id, numberOfItems = 1 }) => {
      for (let i = 0; i < numberOfItems; i += 1) {
        try {
          await updateDiscoveryForUserById({ user_id });
        } catch (e) {
          errorLog(`An error occurred: ${e}`);
          generateSentryErrorForResolver({
            resolverType: 'mutation',
            routeName: 'forceUpdateFeed',
            args: { user_id, numberOfItems },
            errorMsg: e,
            errorName: FORCE_FEED_UPDATE_ERROR,
          });
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
    clearFeed: async (_, { user_id }) => {
      if (!devMode) {
        return {
          success: false,
          message: 'Can\'t clear feed in prod mode',
        };
      }
      try {
        await DiscoveryQueue.findOneAndUpdate({ user_id }, {
          currentDiscoveryItems: [],
        });
        return {
          success: true,
        };
      } catch (e) {
        errorLog(`error occurred clearing discovery feed ${e}`);
        return {
          success: false,
          message: 'Error occured clearing discovery feed',
        };
      }
    },
  },
  DiscoveryQueue: {
    user: async ({ user_id }) => User.findById(user_id),

    /*
    currentDiscoveryItems: async () => {
      const users = await User.find({
        $where: 'this.profile_ids.length > 0',
      }).sort({ updatedAt: -1 }).limit(30).exec();
      return users.map(({ _id }) => new DiscoveryItem({ user_id: _id }));
    },
    */
    // fetch all users in a single call
    // .reverse() reverses in place, so we want to use .slice() to clone
    currentDiscoveryItems: async ({ currentDiscoveryItems }) => {
      const returnedDiscoveryItems = currentDiscoveryItems
        .slice()
        .reverse()
        .map(item => item.toObject());
      const user_ids = returnedDiscoveryItems.map(discoveryItem => discoveryItem.user_id);
      const users = await User.find({ _id: { $in: user_ids } });
      for (const discoveryItem of returnedDiscoveryItems) {
        for (const user of users) {
          if (discoveryItem.user_id.toString() === user._id.toString()) {
            discoveryItem.user = user;
            break;
          }
        }
        if (!discoveryItem.user) {
          // set to null, so that there is a non-undefined value set
          // and the discoveryItem.user resolver knows not to make another db call
          discoveryItem.user = null;
        }
      }
      return returnedDiscoveryItems;
    },
  },
  // this is normally only accessed via currentDiscoveryItems, and users are fetched in a single
  // call, so usually user will be not undefined here
  DiscoveryItem: {
    user: async ({ user_id, user }) => ((user === undefined)
      ? user : User.findById(user_id).exec()),
  },
};
