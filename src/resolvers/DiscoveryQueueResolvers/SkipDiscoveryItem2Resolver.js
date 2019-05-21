import { User } from '../../models/UserModel';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import { SKIP_DISCOVERY_ITEM_ERROR } from '../ResolverErrorStrings';

const errorLogger = require('debug')('error:Matching');

const chalk = require('chalk');

const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));

export const skipDiscoveryItem2Resolver = async ({
  user_id, skippedUser_id,
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
  discoveryQueue.currentDiscoveryItems = discoveryQueue.currentDiscoveryItems
    .filter(discoveryItem => discoveryItem.user_id.toString() !== skippedUser_id.toString());
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
