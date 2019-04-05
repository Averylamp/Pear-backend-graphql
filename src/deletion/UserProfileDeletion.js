import { pick } from 'lodash';
import { User } from '../models/UserModel';
import { DetachedProfile } from '../models/DetachedProfile';
import { UserProfile } from '../models/UserProfileModel';
import {
  DELETE_DETACHED_PROFILE_ERROR, DELETE_DETACHED_PROFILE_SUCCESS,
  DELETE_USER_PROFILE_ERROR, DELETE_USER_PROFILE_SUCCESS,
} from '../resolvers/ResolverErrorStrings';

const debug = require('debug')('dev:UserProfileDeletion');
const errorLog = require('debug')('error:DetachedProfileResolvers');
// const testCaseStyling = chalk.yellow.bold;

export const deleteUserProfile = async (userProfile_id) => {
  // deletes:
  // detached profile linked to this user profile
  // user profile
  // removes references in user in:
  // user profile_ids
  // user endorsedProfile_ids
  // user endorsementEdge (just unsets the user profile id but does NOT delete the edge object)
  // even if there are no longer attachments between the two
  const userProfile = await UserProfile.findById(userProfile_id)
    .exec()
    .catch(err => err);
  if (!userProfile || userProfile instanceof Error) {
    return {
      success: false,
      message: DELETE_USER_PROFILE_ERROR,
    };
  }
  const creator = await User.findById(userProfile.creatorUser_id)
    .exec()
    .catch(err => err);
  if (creator instanceof Error) {
    return {
      success: false,
      message: DELETE_USER_PROFILE_ERROR,
    };
  }
  const user = await User.findById(userProfile.user_id)
    .exec()
    .catch(err => err);
  if (user instanceof Error) {
    return {
      success: false,
      message: DELETE_USER_PROFILE_ERROR,
    };
  }
  const detachedProfile = await DetachedProfile.findOne({
    creatorUser_id: userProfile.creatorUser_id,
    phoneNumber: user.phoneNumber,
  })
    .exec()
    .catch(err => err);
  if (detachedProfile instanceof Error) {
    return {
      success: false,
      message: DELETE_USER_PROFILE_ERROR,
    };
  }

  let deleteDetachedProfilePromise = null;
  const detachedProfileRollback = pick(detachedProfile, [
    '_id',
    'status',
    'creatorUser_id',
    'creatorFirstName',
    'firstName',
    'phoneNumber',
    'age',
    'gender',
    'interests',
    'vibes',
    'bio',
    'dos',
    'donts',
    'images',
    'matchingDemographics',
    'matchingPreferences',
    'userProfile_id',
    'createdAt',
    'updatedAt',
  ]);
  if (detachedProfile) {
    deleteDetachedProfilePromise = DetachedProfile.findByIdAndDelete(detachedProfile._id)
      .exec()
      .catch(err => err);
  }

  const userProfileRollback = pick(userProfile, [
    '_id',
    'creatorUser_id',
    'creatorFirstName',
    'user_id',
    'interests',
    'vibes',
    'bio',
    'dos',
    'donts',
    'firebaseChatDocumentID',
    'firebaseChatDocumentPath',
    'createdAt',
    'updatedAt',
  ]);

  const deleteUserProfilePromise = UserProfile.findByIdAndDelete(userProfile_id)
    .exec().catch(err => err);

  let updateUserPromise = null;
  if (user) {
    updateUserPromise = User.findByIdAndUpdate(user._id, {
      $pull: {
        profile_ids: userProfile._id,
      },
      $unset: {
        'endorsementEdges.$[element].myProfile_id': 1,
      },
      $inc: {
        profileCount: -1,
      },
    }, {
      new: true,
      arrayFilters: [{ 'element.otherUser_id': creator._id.toString() }],
    }).exec()
      .catch(err => err);
  }

  let updateCreatorPromise = null;
  if (creator) {
    updateCreatorPromise = User.findByIdAndUpdate(creator._id, {
      $pull: {
        endorsedProfile_ids: userProfile._id,
      },
      $unset: {
        'endorsementEdges.$[element].theirProfile_id': 1,
      },
    }, {
      new: true,
      arrayFilters: [{ 'element.otherUser_id': user._id.toString() }],
    }).exec()
      .catch(err => err);
  }

  return Promise.all([
    deleteDetachedProfilePromise,
    deleteUserProfilePromise,
    updateUserPromise,
    updateCreatorPromise,
  ])
    .then(async ([
      deleteDetachedProfileResult, deleteUserProfileResult,
      updateUserResult, updateCreatorResult]) => {
      // if at least one of the four operations failed, roll back the others
      if (deleteDetachedProfileResult instanceof Error
        || deleteUserProfileResult instanceof Error
        || updateUserResult instanceof Error
        || updateCreatorResult instanceof Error) {
        debug('error deleting profile, rolling back');
        let errorMessage = '';

        if (deleteDetachedProfileResult instanceof Error) {
          errorMessage += deleteDetachedProfileResult.toString();
        } else if (deleteDetachedProfileResult) {
          // can't override timestamps with Model.save, so we do update with upsert: true
          DetachedProfile.update({
            _id: detachedProfile._id,
          }, detachedProfileRollback, { upsert: true }).exec()
            .then(() => {
              debug('Rolled back detached profile deletion successfully');
            })
            .catch((err) => {
              errorLog(`Failed to roll back detached profile ${err}`);
              debug(`Failed to roll back detached profile ${err}`);
            });
        }

        if (deleteUserProfileResult instanceof Error) {
          errorMessage += deleteDetachedProfileResult.toString();
        } else {
          UserProfile.update({
            _id: userProfile._id,
          }, userProfileRollback, { upsert: true }).exec()
            .then(() => {
              debug('Rolled back user profile deletion successfully');
            })
            .catch((err) => {
              errorLog(`Failed to roll back user profile ${err}`);
              debug(`Failed to roll back user profile ${err}`);
            });
        }

        if (updateUserResult instanceof Error) {
          errorMessage += updateUserResult.toString();
        } else if (updateUserResult) {
          User.findByIdAndUpdate(user._id, {
            $push: {
              profile_ids: userProfile._id,
            },
            'endorsementEdges.$[element].myProfile_id': userProfile._id,
            $inc: {
              profileCount: 1,
            },
          }, {
            new: true,
            arrayFilters: [{ 'element.otherUser_id': creator._id.toString() }],
          }).exec()
            .then(() => {
              debug('Rolled back user object successfully');
            })
            .catch((err) => {
              errorLog(`Failed to roll back user ${err}`);
              debug(`Failed to roll back user ${err}`);
            });
        }

        if (updateCreatorResult instanceof Error) {
          errorMessage += updateCreatorResult.toString();
        } else if (updateCreatorResult) {
          User.findByIdAndUpdate(creator._id, {
            $push: {
              endorsedProfile_ids: userProfile._id,
            },
            'endorsementEdges.$[element].theirProfile_id': userProfile._id,
          }, {
            new: true,
            arrayFilters: [{ 'element.otherUser_id': user._id.toString() }],
          }).exec()
            .then(() => {
              debug('Rolled back creator object successfully');
            })
            .catch((err) => {
              errorLog(`Failed to roll back creator ${err}`);
              debug(`Failed to roll back creator ${err}`);
            });
        }
        errorLog(errorMessage);
        return {
          success: false,
          message: DELETE_USER_PROFILE_ERROR,
        };
      }
      return {
        success: true,
        message: DELETE_USER_PROFILE_SUCCESS,
      };
    });
};

export const deleteDetachedProfile = async (detachedProfile_id) => {
  // deletes detachedProfile object and removes reference in creator.detachedProfile_ids
  const detachedProfile = await DetachedProfile.findById(detachedProfile_id)
    .exec()
    .catch(err => err);
  if (!detachedProfile || detachedProfile instanceof Error) {
    return {
      success: false,
      message: DELETE_DETACHED_PROFILE_ERROR,
    };
  }

  const creator = await User.findById(detachedProfile.creatorUser_id)
    .exec()
    .catch(err => err);
  if (creator instanceof Error) {
    return {
      success: false,
      message: DELETE_DETACHED_PROFILE_ERROR,
    };
  }
  const detachedProfileRollback = pick(detachedProfile, [
    '_id',
    'status',
    'creatorUser_id',
    'creatorFirstName',
    'firstName',
    'phoneNumber',
    'age',
    'gender',
    'interests',
    'vibes',
    'bio',
    'dos',
    'donts',
    'images',
    'matchingDemographics',
    'matchingPreferences',
    'userProfile_id',
    'createdAt',
    'updatedAt',
  ]);

  const deleteDetachedProfilePromise = DetachedProfile.findByIdAndDelete(detachedProfile._id)
    .exec()
    .catch(err => err);

  let updateCreatorPromise = null;
  if (creator) {
    updateCreatorPromise = User.findByIdAndUpdate(creator._id, {
      $pull: {
        detachedProfile_ids: detachedProfile._id,
      },
    }, { new: true })
      .exec()
      .catch(err => err);
  }

  return Promise.all([deleteDetachedProfilePromise, updateCreatorPromise])
    .then(async ([deleteDetachedProfileResult, updateCreatorResult]) => {
      if (deleteDetachedProfileResult instanceof Error || updateCreatorResult instanceof Error) {
        debug('error deleting detached profile, rolling back');
        let errorMessage = '';

        if (deleteDetachedProfileResult instanceof Error) {
          errorMessage += deleteDetachedProfileResult.toString();
        } else {
          // can't override timestamps with Model.save, so we do update with upsert: true
          DetachedProfile.update({
            _id: detachedProfile._id,
          }, detachedProfileRollback, { upsert: true }).exec()
            .then(() => {
              debug('Rolled back detached profile deletion successfully');
            })
            .catch((err) => {
              errorLog(`Failed to roll back detached profile ${err}`);
              debug(`Failed to roll back detached profile ${err}`);
            });
        }

        if (updateCreatorResult instanceof Error) {
          errorMessage += updateCreatorResult.toString();
        } else {
          User.findByIdAndUpdate(creator._id, {
            $push: {
              detachedProfile_ids: detachedProfile._id,
            },
          }, { new: true })
            .exec()
            .then(() => {
              debug('Rolled back creator object successfully');
            })
            .catch((err) => {
              errorLog(`Failed to roll back creator ${err}`);
              debug(`Failed to roll back creator ${err}`);
            });
        }
        errorLog(errorMessage);
        return {
          success: false,
          message: DELETE_DETACHED_PROFILE_ERROR,
        };
      }
      return {
        success: true,
        message: DELETE_DETACHED_PROFILE_SUCCESS,
      };
    });
};
