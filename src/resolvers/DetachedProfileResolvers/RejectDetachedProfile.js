import { User } from '../../models/UserModel';
import {
  GET_DETACHED_PROFILE_ERROR,
  GET_USER_ERROR, WRONG_USER_ERROR,
} from '../ResolverErrorStrings';
import { DetachedProfile } from '../../models/DetachedProfile';
import { recordRejectFR } from '../../models/UserActionModel';

export const rejectDetachedProfileResolver = async ({ rejectDetachedProfileInput }) => {
  const user = await User.findById(rejectDetachedProfileInput.user_id)
    .exec()
    .catch(err => err);
  let detachedProfile = await DetachedProfile
    .findById(rejectDetachedProfileInput.detachedProfile_id)
    .exec()
    .catch(err => err);
  if (!user || user instanceof Error) {
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  if (!detachedProfile || detachedProfile instanceof Error) {
    return {
      success: false,
      message: GET_DETACHED_PROFILE_ERROR,
    };
  }
  if (detachedProfile.status === 'accepted') {
    // no-op if detached profile has already been approved
    return {
      success: true,
      detachedProfile,
    };
  }
  if (user.phoneNumber !== detachedProfile.phoneNumber) {
    return {
      success: false,
      message: WRONG_USER_ERROR,
    };
  }
  detachedProfile.status = 'declined';
  detachedProfile = await detachedProfile.save();
  recordRejectFR({ rejectDetachedProfileInput, detachedProfile });
  return {
    success: true,
    detachedProfile,
  };
};
