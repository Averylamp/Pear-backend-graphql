import { User } from '../../models/UserModel';
import {
  GET_USER_ERROR,
} from '../ResolverErrorStrings';

// const errorLog = require('debug')('error:UpdateUserResolver');

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
  }
  userUpdate.displayedImagesCount = displayedImages.length;

  const updated = await User.findByIdAndUpdate(user_id, userUpdate, { new: true });
  return {
    success: true,
    user: updated,
  };
};
