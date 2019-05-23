import { User } from '../../models/UserModel';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import { SKIP_DISCOVERY_ITEM_ERROR } from '../ResolverErrorStrings';
import { addCardsToCache } from './GetDiscoveryCardsResolver';
import { DISCOVERY_CACHE_SIZE, DISCOVERY_REFRESH_THRESHOLD } from '../../constants';

const errorLogger = require('debug')('error:Matching');

const chalk = require('chalk');

const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));

export const skipDiscoveryItemResolver = async ({
  user_id, discoveryItem_id,
}) => {
  // fetch all relevant objects and perform basic validation
  const user = await User.findById(user_id)
    .exec()
    .catch(() => null);
  if (!user) {
    errorLog(`user with id ${user_id} not found`);
    return {
      success: false,
      message: SKIP_DISCOVERY_ITEM_ERROR,
    };
  }
  const discoveryQueue = await DiscoveryQueue.findOne({ user_id })
    .exec()
    .catch(() => null);
  if (!discoveryQueue) {
    errorLog(`discovery feed for user ${user_id} not found`);
    return {
      success: false,
      message: SKIP_DISCOVERY_ITEM_ERROR,
    };
  }

  let skippedUser_id = null;
  for (const discoveryItem of discoveryQueue.currentDiscoveryItems) {
    if (discoveryItem._id.toString() === discoveryItem_id) {
      skippedUser_id = discoveryItem.user_id.toString();
      break;
    }
  }
  if (!skippedUser_id) {
    errorLog(`discovery item ${discoveryItem_id} for user ${user_id} not found`);
    return {
      success: false,
      message: SKIP_DISCOVERY_ITEM_ERROR,
    };
  }
  discoveryQueue.currentDiscoveryItems = discoveryQueue.currentDiscoveryItems
    .filter(discoveryItem => discoveryItem._id.toString() !== discoveryItem_id);
  if (!discoveryQueue.skippedUser_ids) {
    discoveryQueue.skippedUser_ids = [];
  }
  discoveryQueue.skippedUser_ids.push(skippedUser_id);
  if (!discoveryQueue.decidedDiscoveryItems) {
    discoveryQueue.decidedDiscoveryItems = [];
  }
  discoveryQueue.decidedDiscoveryItems.push({
    user_id: skippedUser_id,
    action: 'skip',
  });
  const res = await discoveryQueue.save().catch(err => err);
  try {
    if (discoveryQueue.currentDiscoveryItems.length < DISCOVERY_REFRESH_THRESHOLD) {
      await addCardsToCache({
        user,
        discoveryQueue: res,
        nCardsToAdd: DISCOVERY_CACHE_SIZE - discoveryQueue.currentDiscoveryItems.length,
      });
    }
  } catch (e) {
    errorLog(`error occurred trying to refresh discovery cache: ${e}`);
  }
  if (res instanceof Error) {
    errorLog(res.toString());
    return {
      success: false,
      message: SKIP_DISCOVERY_ITEM_ERROR,
    };
  }
  return {
    success: true,
  };
};
