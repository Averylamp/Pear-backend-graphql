import { User } from '../../models/UserModel';
import { DetachedProfile } from '../../models/DetachedProfile';

const errorLog = require('debug')('error:DetachedProfileResolverUtils');

export const canMakeProfileForSelf = [
  '9738738225',
  '2067789236',
  '6196160848',
  '9165290384',
];

export const getAndValidateUsersAndDetachedProfileObjects = async ({
  user_id, detachedProfile_id, creator_id,
}) => {
  const userPromise = User.findById(user_id)
    .exec()
    .catch(() => null);
  const detachedProfilePromise = DetachedProfile.findById(detachedProfile_id)
    .exec()
    .catch(() => null);
  const [user, detachedProfile] = await Promise.all([
    userPromise,
    detachedProfilePromise]);
  if (!user) {
    errorLog(`Couldn't find user with id ${user_id}`);
    throw new Error(`Couldn't find user with id ${user_id}`);
  }
  if (!detachedProfile) {
    errorLog(`Couldn't find detached profile with id ${detachedProfile_id}`);
    throw new Error(`Couldn't find detached profile with id ${detachedProfile_id}`);
  }
  // check that this user is indeed the user referenced by the detached profile
  if (user.phoneNumber !== detachedProfile.phoneNumber) {
    errorLog(`user phone number is ${user.phoneNumber}`);
    errorLog(`detached profile phone number is ${detachedProfile.phoneNumber}`);
    errorLog(
      `Detached profile with phone number ${detachedProfile.phoneNumber} can't be viewed by this user`,
    );
    throw new Error(
      `Detached profile with phone number ${detachedProfile.phoneNumber} can't be viewed by this user`,
    );
  }
  let creator = null;
  if (creator_id) {
    creator = await User.findById(creator_id)
      .exec()
      .catch(() => null);
    if (!creator) {
      errorLog(`Couldn't find creator with id ${creator_id}`);
      throw new Error(`Couldn't find creator with id ${creator_id}`);
    }

    // check that creator made detached profile
    if (creator_id.toString() !== detachedProfile.creatorUser_id.toString()) {
      errorLog(`Creator with id ${creator_id} did not make detached profile ${detachedProfile_id}`);
      throw new Error(
        `Creator with id ${creator_id} did not make detached profile ${detachedProfile_id}`,
      );
    }
    // check creator != user
    if (creator_id.toString() === user_id.toString()) {
      if (process.env.DB_NAME !== 'prod2'
        && canMakeProfileForSelf.includes(detachedProfile.phoneNumber)) {
        // we ignore this check if phoneNumber is whitelisted and we aren't touching prod db
      } else {
        errorLog(`Endorsed user with id ${user_id} is same as profile creator`);
        throw new Error(`Endorsed user with id ${user_id} is same as profile creator`);
      }
    }
    // check creator has not already made a profile for user
    if (user.endorser_ids.map(endorser_id => endorser_id.toString())
      .includes(creator_id.toString())) {
      errorLog(`creator ${creator_id} has already made a profile for user ${user_id}`);
      throw new Error(`creator ${creator_id} has already made a profile for user ${user_id}`);
    }
  }
  return {
    user,
    detachedProfile,
    creator,
  };
};
