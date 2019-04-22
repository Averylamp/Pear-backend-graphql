import { pick } from 'lodash';
import { User } from '../models/UserModel';
import { DetachedProfile } from '../models/DetachedProfile';
import {
  DELETE_DETACHED_PROFILE_ERROR, DELETE_DETACHED_PROFILE_SUCCESS,
} from '../resolvers/ResolverErrorStrings';

const debug = require('debug')('dev:UserProfileDeletion');
const errorLog = require('debug')('error:DetachedProfileResolvers');
// const testCaseStyling = chalk.yellow.bold;

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
