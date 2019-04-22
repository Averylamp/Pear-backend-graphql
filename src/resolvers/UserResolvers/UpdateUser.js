import { pick } from 'lodash';
import { User } from '../../models/UserModel';
import {
  GET_USER_ERROR,
} from '../ResolverErrorStrings';
import { LAST_ACTIVE_ARRAY_LEN, LAST_EDITED_ARRAY_LEN } from '../../constants';

// const errorLog = require('debug')('error:UpdateUserResolver');

const generateReferralCode = async (firstName, maxIters = 20) => {
  let flag = true;
  let code = null;
  let count = 0;
  while (flag && count < maxIters) {
    count += 1;
    code = firstName;
    code += Math.floor(Math.random() * 900 + 100).toString();
    const findResult = await User.findOne({ referralCode: code });
    if (!findResult) {
      flag = false;
    }
  }
  return code;
};

export const updateUserResolver = async ({ updateUserInput }) => {
  const now = new Date();
  const user = await User.findById(updateUserInput.user_id);
  if (!user) {
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  const userUpdateObj = pick(updateUserInput, [
    'age',
    'birthdate',
    'email',
    'emailVerified',
    'phoneNumber',
    'phoneNumberVerified',
    'firstName',
    'lastName',
    'gender',
    'school',
    'schoolYear',
    'isSeeking',
    'deactivated',
    'thumbnailURL',
    'firebaseRemoteInstanceID',
  ]);
  userUpdateObj.$push = {
    lastActiveTimes: {
      $each: [new Date()],
      $slice: -1 * LAST_ACTIVE_ARRAY_LEN,
    },
    lastEditedTimes: {
      $each: [new Date()],
      $slice: -1 * LAST_EDITED_ARRAY_LEN,
    },
  };
  // set referral code if this is the first time setting firstName
  if (!user.firstName && updateUserInput.firstName) {
    const referralCode = await generateReferralCode(updateUserInput.firstName);
    if (referralCode) {
      userUpdateObj.referralCode = referralCode;
    }
  }
  // mongo dot notation for updates
  if (updateUserInput.seekingGender) {
    userUpdateObj['matchingPreferences.seekingGender'] = updateUserInput.seekingGender.filter(
      item => ['male', 'female', 'nonbinary'].includes(item),
    );
  }
  if (updateUserInput.maxDistance) {
    userUpdateObj['matchingPreferences.maxDistance'] = updateUserInput.maxDistance;
  }
  if (updateUserInput.minAgeRange) {
    userUpdateObj['matchingPreferences.minAgeRange'] = updateUserInput.minAgeRange;
  }
  if (updateUserInput.maxAgeRange) {
    userUpdateObj['matchingPreferences.maxAgeRange'] = updateUserInput.maxAgeRange;
  }
  if (updateUserInput.age) {
    userUpdateObj['matchingDemographics.age'] = updateUserInput.age;
  }
  if (updateUserInput.gender) {
    userUpdateObj['matchingDemographics.gender'] = updateUserInput.gender;
  }
  if (updateUserInput.location) {
    userUpdateObj['matchingPreferences.location.point.coordinates'] = updateUserInput.location;
    userUpdateObj['matchingPreferences.location.point.updatedAt'] = now;
    userUpdateObj['matchingDemographics.location.point.coordinates'] = updateUserInput.location;
    userUpdateObj['matchingDemographics.location.point.updatedAt'] = now;
  }
  if (updateUserInput.locationName) {
    // note that if locationName has never been set, it won't have a createdAt field
    // TODO either rewrite all of this resolver's logic to use model.save, or else do a check
    // and set createdAt here if necessary.
    // TODO actually we gotta do this for pretty much any object we're using the driver to
    // update that has mongoose timestamps :(
    userUpdateObj['matchingPreferences.location.locationName.name'] = updateUserInput.locationName;
    userUpdateObj['matchingPreferences.location.locationName.updatedAt'] = now;
    userUpdateObj['matchingDemographics.location.locationName.name'] = updateUserInput.locationName;
    userUpdateObj['matchingDemographics.location.locationName.updatedAt'] = now;
  }

  const updatedUser = await User
    .findByIdAndUpdate(updateUserInput.user_id, userUpdateObj, { new: true });
  return {
    success: true,
    user: updatedUser,
  };
};
