import { User } from '../models/UserModel';
import { DetachedProfile } from '../models/DetachedProfile';
import { UserProfile } from '../models/UserProfileModel';
import { DiscoveryQueue } from '../models/DiscoveryQueueModel';

const testLogger = require('debug')('tests:UserDeletion');
const chalk = require('chalk');

// const testCaseStyling = chalk.yellow.bold;
const testStyling = chalk.green.bold;

const testLog = log => testLogger(testStyling(log));

export const deleteUser = async (user_id) => {
  // deletes:
  // detached profiles created by user
  // profiles created for the user (and associated references)
  // discoveryQueue associated with user
  // the user object itself
  // DOES NOT delete:
  // attached profiles created by user
  // discovery items referencing this user
  // images uploaded by this user attached to other users
  // match objects referencing this user
  // endorsement edges of other users referencing this user
  // match edge summaries referencing this user
  // blocked user IDs referencing this user

  // THIS IS NOT SUPER THOROUGHLY TESTED. I TESTED IT BY DELETING ONE USER IN TEST DB
  // USE AT YOUR OWN RISK -Brian
  let message = '';
  const addErrorToMessage = (err) => { message += (`\n${err}`); };
  testLog(`removing user and references for id: ${user_id}`);
  const user = await User.findById(user_id).exec().catch(addErrorToMessage);
  if (!user) {
    throw new Error(`user with id ${user_id} doesn't exit`);
  }
  await DiscoveryQueue.deleteMany({ user_id }).exec().catch(addErrorToMessage);
  testLog('deleted associated discovery queue');
  await DetachedProfile.deleteMany({ creatorUser_id: user_id }).exec().catch(addErrorToMessage);
  testLog('deleted detached profiles made by user');
  const profiles = await UserProfile.find({ user_id }).exec().catch(addErrorToMessage);
  for (const profile of profiles) {
    if (profile && profile.creatorUser_id && profile._id) {
      await User.findByIdAndUpdate(profile.creatorUser_id, {
        $pull: {
          endorsedProfile_ids: profile._id,
        },
      }, { new: true }).exec().catch(addErrorToMessage);
      await profile.remove().catch(addErrorToMessage);
      testLog(`removed profile made by ${profile.creatorFirstName}`);
    }
  }
  testLog('deleted profiles made for user, and references');
  await user.remove().catch(addErrorToMessage);
  testLog('deleted user object');
  if (message !== '') {
    throw new Error(message);
  }
};
