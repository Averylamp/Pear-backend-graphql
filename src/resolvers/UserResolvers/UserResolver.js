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
        return {
          success: false,
          message: CREATE_USER_ERROR,
        };
      }
    },
    updateUser: async (_source, { id, updateUserInput }) => {
      try {
        const now = new Date();
        const user = await User.findById(id);
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
        if (user.lastActive) {
          userUpdateObj.$push = {
            lastActive: {
              $each: [new Date()],
              $slice: -1 * LAST_ACTIVE_ARRAY_LEN,
            },
          };
        } else {
          userUpdateObj.lastActive = [new Date()];
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

        const updatedUser = await User.findByIdAndUpdate(id, userUpdateObj, { new: true });
        return {
          success: true,
          user: updatedUser,
        };
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
