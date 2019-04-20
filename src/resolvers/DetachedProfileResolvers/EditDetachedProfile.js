import { User } from '../../models/UserModel';
import {
  GET_DETACHED_PROFILE_ERROR,
  GET_USER_ERROR, WRONG_CREATOR_ERROR,
} from '../ResolverErrorStrings';
import { DetachedProfile } from '../../models/DetachedProfile';

export const editDetachedProfileResolver = async ({ editDetachedProfileInput }) => {
  const creator = await User.findById(editDetachedProfileInput.creatorUser_id)
    .exec()
    .catch(err => err);
  let detachedProfile = await DetachedProfile.findById(editDetachedProfileInput._id)
    .exec()
    .catch(err => err);
  if (!creator || creator instanceof Error) {
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
  if (detachedProfile.creatorUser_id.toString() !== creator._id.toString()) {
    return {
      success: false,
      message: WRONG_CREATOR_ERROR,
    };
  }
  if (detachedProfile.userProfile_id || detachedProfile.status === 'accepted') {
    // edits don't happen if detached profile has already been approved
    return {
      success: true,
      detachedProfile,
    };
  }

  detachedProfile = Object.assign(detachedProfile, editDetachedProfileInput);
  detachedProfile.status = 'waitingUnseen';
  detachedProfile = await detachedProfile.save();
  return {
    success: true,
    detachedProfile,
  };
};
