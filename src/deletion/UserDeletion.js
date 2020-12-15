import { User } from '../models/UserModel';
import { DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { Match } from '../models/MatchModel';

const errorLogger = require('debug')('error:UserDeletion');
const chalk = require('chalk');

// const testCaseStyling = chalk.yellow.bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const debug = require('debug')('dev:UserDeletion');


export const deleteUserResolver = async (user_id) => {
  // deletes:
  // detached profiles created by user
  // discoveryQueue associated with user
  // the user object itself (including content written for user)
  // match objects referencing this user
  // match edge summaries referencing this user
  // endorsement edges of other users referencing this user
  // discoveryItems of other user feeds referencing this user
  let message = '';
  const addErrorToMessage = (err) => { message += (`\n${err}`); };
  debug(`removing user and references for id: ${user_id}`);
  const user = await User.findById(user_id).exec().catch(addErrorToMessage);
  if (!user) {
    throw new Error(`user with id ${user_id} doesn't exit`);
  }

  await DiscoveryQueue.deleteMany({ user_id }).exec().catch(addErrorToMessage);
  debug('deleted associated discovery queue');

  const matchedUser_ids = user.edgeSummaries.map(edge => edge.otherUser_id.toString());
  await User.updateMany({ _id: { $in: matchedUser_ids } }, {
    $pull: {
      edgeSummaries: {
        otherUser_id: user_id,
      },
    },
  }).exec().catch(addErrorToMessage);
  const matchDelRes = await Match.deleteMany({
    $or: [{
      sentForUser_id: user_id,
    }, {
      receivedByUser_id: user_id,
    }],
  }).catch(addErrorToMessage);
  debug(`deleted ${matchDelRes.deletedCount} matches`);

  const friend_ids = user.endorsementEdges.map(edge => edge.otherUser_id.toString());
  let nFriendsUnlinked = 0;
  for (const friend_id of friend_ids) {
    const friend = await User.findById(friend_id).catch(() => null);
    if (!friend) {
      errorLog(`couldn't find friend with id ${friend_id}`);
      continue;
    }
    friend.endorser_ids = friend.endorser_ids
      .filter(endorser_id => endorser_id.toString() !== user_id.toString());
    friend.endorsedUser_ids = friend.endorsedUser_ids
      .filter(endorser_id => endorser_id.toString() !== user_id.toString());
    friend.endorserCount = friend.endorser_ids.length;
    friend.endorsedUsersCount = friend.endorsedUser_ids.length;
    friend.endorsementEdges = friend.endorsementEdges
      .filter(edge => edge.otherUser_id.toString() !== user_id.toString());
    await friend.save().catch(addErrorToMessage);
    nFriendsUnlinked += 1;
  }
  debug(`unlinked ${nFriendsUnlinked} friends`);

  const feedsModifiedRes = await DiscoveryQueue.updateMany({
    currentDiscoveryItems: {
      $elemMatch: {
        user_id,
      },
    },
  }, {
    $pull: {
      currentDiscoveryItems: { user_id },
    },
  });
  debug(`updated ${feedsModifiedRes.nModified} discovery queues`);

  await user.remove().catch(addErrorToMessage);
  debug('deleted user object');
  if (message !== '') {
    throw new Error(message);
  }
  return {
    success: true,
  };
};
