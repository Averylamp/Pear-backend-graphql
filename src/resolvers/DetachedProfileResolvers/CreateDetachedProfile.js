import { pick } from 'lodash';
import { User } from '../../models/UserModel';
import {
  ALREADY_MADE_PROFILE,
  CANT_ENDORSE_YOURSELF, CREATE_DETACHED_PROFILE_ERROR,
  GET_USER_ERROR,
} from '../ResolverErrorStrings';
import { createDetachedProfileObject, DetachedProfile } from '../../models/DetachedProfile';
import { canMakeProfileForSelf } from './DetachedProfileResolverUtils';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { rollbackObject } from '../../../util/util';
import { postProfileCreation } from '../../SlackHelper';
import { recordSendFR } from '../../models/UserActionModel';

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
    'lastName',
    'gender',
    'phoneNumber',
    'questionResponses',
  ]);
  finalDetachedProfileInput._id = detachedProfileID;

  finalDetachedProfileInput.matchingDemographics = {
    gender: detachedProfileInput.gender,
  };
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
  const initialCreator = creator.toObject();
  try {
    const user = await User.findOne({ phoneNumber: detachedProfileInput.phoneNumber }).exec();
    if (user) {
      const creatorDetachedProfiles = await DetachedProfile.find({ creatorUser_id })
        .exec();
      const userEndorser_ids = user.endorser_ids.map(endorser_id => endorser_id.toString());
      const dpPhoneNumbers = creatorDetachedProfiles.map(dp => dp.phoneNumber);
      if (detachedProfileInput.phoneNumber === creator.phoneNumber) {
        if (process.env.DB_NAME !== 'prod2'
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
    }
  } catch (e) {
    errorLog(`An error occurred: ${e}`);
    generateSentryErrorForResolver({
      resolverType: 'mutation',
      routeName: 'createDetachedProfile',
      args: { detachedProfileInput },
      errorMsg: e,
      errorName: CREATE_DETACHED_PROFILE_ERROR,
    });
    return {
      success: false,
      message: CREATE_DETACHED_PROFILE_ERROR,
    };
  }
  // set firstName and thumbnailURL of bio and questionResponses and profile
  if (creator.firstName) {
    finalDetachedProfileInput.creatorFirstName = creator.firstName;
  }
  if (creator.thumbnailURL) {
    finalDetachedProfileInput.creatorThumbnailURL = creator.thumbnailURL;
  }
  for (const questionResponse of finalDetachedProfileInput.questionResponses) {
    if (creator.firstName) {
      questionResponse.authorFirstName = creator.firstName;
    }
    if (creator.thumbnailURL) {
      questionResponse.authorThumbnailURL = creator.thumbnailURL;
    }
  }
  if (finalDetachedProfileInput.bio) {
    if (creator.firstName) {
      finalDetachedProfileInput.bio.authorFirstName = creator.firstName;
    }
    if (creator.thumbnailURL) {
      finalDetachedProfileInput.bio.authorThumbnailURL = creator.thumbnailURL;
    }
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
        }
        await rollbackObject({
          model: User,
          object_id: creatorUser_id,
          initialObject: initialCreator,
          onSuccess: () => { debug('Rolled back creator object successfully'); },
          onFailure: (err) => { errorLog(`Failed to roll back creator object: ${err}`); },
        });
        errorLog(errorMessage);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'createDetachedProfile',
          args: { detachedProfileInput },
          errorMsg: errorMessage,
          errorName: CREATE_DETACHED_PROFILE_ERROR,
        });
        return {
          success: false,
          message: CREATE_DETACHED_PROFILE_ERROR,
        };
      }

      try {
        postProfileCreation({
          userName: detachedProfileObject.creatorFirstName,
          detachedUserName: detachedProfileObject.firstName,
          contentItems: finalDetachedProfileInput.questionResponses,
        });
      } catch (err) {
        errorLog(err);
      }

      debug('Completed successfully');
      recordSendFR({ detachedProfileInput });
      return {
        success: true,
        detachedProfile: detachedProfileObject,
      };
    });
};
