import { pick } from 'lodash';
import { DetachedProfile } from '../../models/DetachedProfile';
import {
  DiscoveryQueue,
} from '../../models/DiscoveryQueueModel';
import { User } from '../../models/UserModel';
import { UserProfile } from '../../models/UserProfileModel';
import { Match } from '../../models/MatchModel';
import { authenticateUser, sendNewMessagePushNotification } from '../../FirebaseManager';
import {
  CREATE_USER_ERROR,
  GET_USER_ERROR, UPDATE_USER_ERROR,
  UPDATE_USER_PHOTOS_ERROR,
} from '../ResolverErrorStrings';
import { LAST_ACTIVE_ARRAY_LEN } from '../../constants';
import { createUserResolver } from './CreateUser';
import { updateUserResolver } from './UpdateUser';

const debug = require('debug')('dev:UserResolvers');
const errorLog = require('debug')('error:UserResolver');
const functionCallConsole = require('debug')('dev:FunctionCalls');

export const resolvers = {
  User: {
    discoveryQueueObj: async ({ discoveryQueue_id }) => DiscoveryQueue.findById(discoveryQueue_id),
    blockedUsers: async ({ blockedUser_ids }) => User.find({ _id: { $in: blockedUser_ids } }),
    requestedMatches: async ({ requestedMatch_ids }) => Match
      .find({ _id: { $in: requestedMatch_ids } }),
    currentMatches: async ({ currentMatch_ids }) => Match
      .find({ _id: { $in: currentMatch_ids } }),
    edgeUser_ids: async ({ edgeSummaries }) => [
      ...new Set(edgeSummaries.map(summary => summary.otherUser_id)),
    ],
    endorsers: async ({ endorser_ids }) => User.find({ _id: { $in: endorser_ids } }),
    endorsedUsers: async ({ endorsedUser_ids }) => User.find({ _id: { $in: endorsedUser_ids } }),
    detachedProfiles: async ({ detachedProfile_ids }) => DetachedProfile
      .find({ _id: { $in: detachedProfile_ids } }),
  },
  Query: {
    user: async (_source, { id }) => {
      debug(`Getting user by id: ${id}`);
      return User.findById(id);
    },
    getUser: async (_source, { userInput }) => {
      functionCallConsole('Get User Called');
      const token = userInput.firebaseToken;
      const uid = userInput.firebaseAuthID;
      try {
        const authenticatedUID = await authenticateUser(uid, token);
        const user = await User.findOne({ firebaseAuthID: authenticatedUID })
          .exec();
        if (user) {
          let userUpdateObj = {};
          if (user.lastActive) {
            userUpdateObj.$push = {
              lastActive: {
                $each: [new Date()],
                $slice: -1 * LAST_ACTIVE_ARRAY_LEN,
              },
            };
          } else {
            userUpdateObj = {
              lastActive: [new Date()],
            };
          }
          await User.findByIdAndUpdate(user._id, userUpdateObj);
          return {
            success: true,
            user,
          };
        }
        return {
          success: false,
          message: GET_USER_ERROR,
        };
      } catch (e) {
        errorLog(`An error occurred getting user: ${e}`);
        return {
          success: false,
          message: GET_USER_ERROR,
        };
      }
    },
    notifyNewMessage: async (_source, { fromUser_id, toUser_id }) => {
      const from = await User.findById(fromUser_id)
        .exec();
      const to = await User.findById(toUser_id)
        .exec();
      if (!from || !to) {
        return false;
      }
      sendNewMessagePushNotification({
        from,
        to,
      });
      return true;
    },
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      functionCallConsole('Create User');
      try {
        return createUserResolver({ userInput });
      } catch (e) {
        errorLog(`error occurred while creating user: ${e}`);
        return {
          success: false,
          message: CREATE_USER_ERROR,
        };
      }
    },
    updateUser: async (_source, { updateUserInput }) => {
      try {
        return updateUserResolver({ updateUserInput });
      } catch (e) {
        errorLog(`error occurred while updating user: ${e}`);
        return {
          success: false,
          message: UPDATE_USER_ERROR,
        };
      }
    },
    updateUserPhotos: async (_source, { updateUserPhotosInput }) => {
      functionCallConsole('Update Photos Called');
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
      return User.findByIdAndUpdate(user_id, userUpdate, { new: true })
        .then(res => ({
          success: true,
          user: res,
        }))
        .catch(() => ({
          success: false,
          message: UPDATE_USER_PHOTOS_ERROR,
        }));
    },
  }
  ,
};
