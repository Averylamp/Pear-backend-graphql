import { User } from '../../models/UserModel';
import {
  GET_USER_ERROR,
} from '../ResolverErrorStrings';
import { DetachedProfile } from '../../models/DetachedProfile';
import { recordUpdateUserPhotos } from '../../models/UserActionModel';

// const errorLog = require('debug')('error:UpdateUserResolver');

const updateAllThumbnails = async ({ user, thumbnailURL }) => {
  const detachedProfiles = await DetachedProfile.find({ _id: { $in: user.detachedProfile_ids } });
  const endorsees = await User.find({ _id: { $in: user.endorsedUser_ids } });
  for (const detachedProfile of detachedProfiles) {
    // set thumbnailURL of bio and questionResponses and dp
    if (thumbnailURL) {
      detachedProfile.creatorThumbnailURL = thumbnailURL;
    }
    for (const questionResponse of detachedProfile.questionResponses) {
      if (thumbnailURL) {
        questionResponse.authorThumbnailURL = thumbnailURL;
      }
    }
    detachedProfile.save();
  }
  for (const endorsee of endorsees) {
    // set thumbnailURL of bio and questionResponses
    for (const questionResponse of endorsee.questionResponses) {
      if (questionResponse.author_id.toString() === user._id.toString()) {
        if (thumbnailURL) {
          questionResponse.authorThumbnailURL = thumbnailURL;
        }
      }
    }
    endorsee.save();
  }
};

export const updateUserPhotosResolver = async ({ updateUserPhotosInput }) => {
  const { user_id, displayedImages, additionalImages } = updateUserPhotosInput;
  const user = await User.findById(user_id);
  if (!user) {
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  const toAddToImageBank = [];
  displayedImages.forEach((createImageContainer) => {
    let imageAlreadyInBank = false;
    for (const userImageContainer of user.bankImages) {
      if (userImageContainer.imageID === createImageContainer.imageID) {
        imageAlreadyInBank = true;
        break;
      }
    }
    if (!imageAlreadyInBank) {
      toAddToImageBank.push(createImageContainer);
    }
  });

  additionalImages.forEach((createImageContainer) => {
    let imageAlreadyInBank = false;
    for (const userImageContainer of user.bankImages) {
      if (userImageContainer.imageID === createImageContainer.imageID) {
        imageAlreadyInBank = true;
        break;
      }
    }
    if (!imageAlreadyInBank) {
      toAddToImageBank.push(createImageContainer);
    }
  });

  const userUpdate = {
    displayedImages,
    $push: {
      bankImages: {
        $each: toAddToImageBank,
      },
    },
  };
  if (displayedImages.length > 0
    && displayedImages[0]
    && displayedImages[0].thumbnail
    && displayedImages[0].thumbnail.imageURL) {
    userUpdate.thumbnailURL = displayedImages[0].thumbnail.imageURL;
    updateAllThumbnails({ user, thumbnailURL: userUpdate.thumbnailURL });
  }
  userUpdate.displayedImagesCount = displayedImages.length;

  const updated = await User.findByIdAndUpdate(user_id, userUpdate, { new: true });
  recordUpdateUserPhotos({ updateUserPhotosInput });
  return {
    success: true,
    user: updated,
  };
};
