import { pick } from 'lodash';
import { User } from '../../models/UserModel';
import {
  ALREADY_MADE_PROFILE,
  CANT_ENDORSE_YOURSELF, CREATE_DETACHED_PROFILE_ERROR,
  GET_USER_ERROR,
} from '../ResolverErrorStrings';
import { createDetachedProfileObject, DetachedProfile } from '../../models/DetachedProfile';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import { NEW_PROFILE_BONUS } from '../../constants';
import {
  updateDiscoveryForUserById,
  updateDiscoveryWithNextItem,
} from '../../discovery/DiscoverProfile';
import { canMakeProfileForSelf } from './DetachedProfileResolverUtils';

const mongoose = require('mongoose');
const debug = require('debug')('dev:DetachedProfileResolvers');
const errorLog = require('debug')('error:DetachedProfileResolvers');

export const createDetachedProfileResolver = async ({ detachedProfileInput }) => {
  const detachedProfileID = '_id' in detachedProfileInput
    ? detachedProfileInput._id : mongoose.Types.ObjectId();
  const finalDetachedProfileInput = pick(detachedProfileInput, [
    'creatorUser_id',
    'creatorFirstName',
    'firstName',
    'phoneNumber',
    'boasts',
    'roasts',
    'questionResponses',
    'vibes',
    'bio',
    'dos',
    'donts',
    'interests',
  ]);
  finalDetachedProfileInput._id = detachedProfileID;

  finalDetachedProfileInput.matchingDemographics = {};
  finalDetachedProfileInput.matchingPreferences = {
    seekingGender: ['nonbinary', 'male', 'female'],
  };

  // perform validation
  const { creatorUser_id } = detachedProfileInput;
  const creator = await User.findById(creatorUser_id)
    .exec()
    .catch(err => err);
  if (!creator) {
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  try {
    const user = await User.findOne({ phoneNumber: detachedProfileInput.phoneNumber }).exec();
    const creatorDetachedProfiles = await DetachedProfile.find({ creatorUser_id })
      .exec();
    const userEndorser_ids = user.endorser_ids.map(endorser_id => endorser_id.toString());
    const dpPhoneNumbers = creatorDetachedProfiles.map(dp => dp.phoneNumber);
    if (detachedProfileInput.phoneNumber === creator.phoneNumber) {
      if (process.env.DB_NAME !== 'prod'
        && canMakeProfileForSelf.includes(creator.phoneNumber)) {
        // we ignore this check if phoneNumber is whitelisted and we aren't touching prod db
      } else {
        return {
          success: false,
          message: CANT_ENDORSE_YOURSELF,
        };
      }
    }
    if (dpPhoneNumbers.includes(detachedProfileInput.phoneNumber)) {
      return {
        success: false,
        message: ALREADY_MADE_PROFILE,
      };
    }
    if (userEndorser_ids.includes(detachedProfileInput.creatorUser_id.toString())) {
      return {
        success: false,
        message: ALREADY_MADE_PROFILE,
      };
    }
  } catch (e) {
    errorLog(`An error occurred: ${e}`);
    return {
      success: false,
      message: CREATE_DETACHED_PROFILE_ERROR,
    };
  }

  // update creator's user object
  const updateCreatorUserObject = User.findByIdAndUpdate(creatorUser_id, {
    $push: {
      detachedProfile_ids: detachedProfileID,
    },
    $inc: {
      detachedProfilesCount: 1,
    },
  }, { new: true })
    .exec()
    .catch(err => err);

  // create new detached profile
  const createDetachedProfileObj = createDetachedProfileObject(finalDetachedProfileInput)
    .catch(err => err);

  return Promise.all([updateCreatorUserObject, createDetachedProfileObj])
    .then(async ([newUser, detachedProfileObject]) => {
      if (newUser == null || detachedProfileObject instanceof Error || newUser instanceof Error) {
        let errorMessage = '';
        if (detachedProfileObject instanceof Error) {
          errorMessage += `Was unable to create DP: ${detachedProfileObject.toString()}`;
        } else {
          detachedProfileObject.remove((err) => {
            if (err) {
              debug(`Failed to remove discovery object${err}`);
            } else {
              debug('Removed created discovery object successfully');
            }
          });
        }
        if (newUser instanceof Error) {
          errorMessage += `error adding DP to user: ${newUser.toString()}`;
        } else {
          User.findByIdAndUpdate(creatorUser_id, {
            $pull: {
              detachedProfile_ids: detachedProfileID,
            },
          }, { new: true }, (err) => {
            if (err) {
              errorLog(`Failed to roll back creator object: ${err}`);
            } else {
              debug('Rolled back creator object successfully');
            }
          }).exec();
        }
        errorLog(errorMessage);
        return {
          success: false,
          message: CREATE_DETACHED_PROFILE_ERROR,
        };
      }
      debug('Completed successfully');
      // populate creator's feed if feed is empty (i.e. this is the first profile they've made)
      try {
        const feed = await DiscoveryQueue.findById(creator.discoveryQueue_id);
        const devMode = process.env.DEV === 'true';
        const regenTestDBMode = (process.env.REGEN_DB === 'true' && devMode);
        if (feed.currentDiscoveryItems.length === 0 && !regenTestDBMode) {
          for (let i = 0; i < NEW_PROFILE_BONUS; i += 1) {
            await updateDiscoveryForUserById({ user_id: creatorUser_id });
          }
        }
      } catch (e) {
        debug(`error occurred when trying to populate discovery feed: ${e}`);
      }
      return {
        success: true,
        detachedProfile: detachedProfileObject,
      };
    });
};
