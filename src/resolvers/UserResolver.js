import { pick } from 'lodash';
import { DetachedProfile } from '../models/DetachedProfile';
import { DiscoveryQueue, createDiscoveryQueueObject } from '../models/DiscoveryQueueModel';
import { User, createUserObject } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { Match } from '../models/MatchModel';
import { authenticateUser, sendNewMessagePushNotification } from '../FirebaseManager';
import {
  CREATE_USER_ERROR,
  GET_USER_ERROR, UPDATE_USER_ERROR,
  UPDATE_USER_PHOTOS_ERROR,
} from './ResolverErrorStrings';
import { INITIALIZED_FEED_LENGTH } from '../constants';
import { updateDiscoveryWithNextItem } from '../discovery/DiscoverProfile';

const mongoose = require('mongoose');
const debug = require('debug')('dev:UserResolvers');
const errorLog = require('debug')('error:UserResolver');
const functionCallConsole = require('debug')('dev:FunctionCalls');

const generateReferralCode = async (firstName, maxIters = 20) => {
  const numeric = '0123456789';
  const alphanumeric = '0123456789abcdefghijklmnopqrstuvwxyz';
  let flag = true;
  let code = null;
  let count = 0;
  while (flag && count < maxIters) {
    count += 1;
    code = firstName;
    code += numeric[Math.floor(Math.random() * numeric.length)];
    code += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
    code += numeric[Math.floor(Math.random() * numeric.length)];
    code += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
    const findResult = await User.findOne({ referralCode: code });
    if (!findResult) {
      flag = false;
    }
  }
  errorLog(code);
  return code;
};

export const resolvers = {
  User: {
    profileObjs: async ({ profile_ids }) => UserProfile.find({ _id: { $in: profile_ids } }),
    endorsedProfileObjs: async ({ endorsedProfile_ids }) => UserProfile
      .find({ _id: { $in: endorsedProfile_ids } }),
    detachedProfileObjs: async ({ detachedProfile_ids }) => DetachedProfile
      .find({ _id: { $in: detachedProfile_ids } }),
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
      return new Promise(resolve => authenticateUser(uid, token)
        .then((authenticatedUID) => {
          const user = User.findOne({ firebaseAuthID: authenticatedUID });
          if (user) {
            resolve({
              success: true,
              user,
            });
          } else {
            resolve({
              success: false,
              message: GET_USER_ERROR,
            });
          }
        })
        .catch(() => {
          resolve({
            success: false,
            message: GET_USER_ERROR,
          });
        }));
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
      const userObjectID = '_id' in userInput ? userInput._id : mongoose.Types.ObjectId();
      const discoveryQueueObjectID = mongoose.Types.ObjectId();

      const finalUserInput = pick(userInput, [
        'age',
        'birthdate',
        'email',
        'emailVerified',
        'phoneNumber',
        'phoneNumberVerified',
        'firstName',
        'lastName',
        'gender',
        'firebaseToken',
        'firebaseAuthID',
        'facebookId',
        'facebookAccessToken',
        'thumbnailURL',
        'firebaseRemoteInstanceID',
        'referredByCode',
        'seeded',
      ]);
      finalUserInput._id = userObjectID;
      finalUserInput.discoveryQueue_id = discoveryQueueObjectID;
      const locationObj = {
        point: {
          coordinates: userInput.location,
        },
      };
      finalUserInput.matchingDemographics = {
        location: locationObj,
        gender: userInput.gender,
        age: userInput.age,
      };
      finalUserInput.matchingPreferences = { location: locationObj };
      // Set defaults for gender preference if not specified
      if (!finalUserInput.matchingPreferences.seekingGender) {
        if (userInput.gender === 'male') {
          finalUserInput.matchingPreferences.seekingGender = ['female'];
        }
        if (userInput.gender === 'female') {
          finalUserInput.matchingPreferences.seekingGender = ['male'];
        }
        if (userInput.gender === 'nonbinary') {
          finalUserInput.matchingPreferences.seekingGender = ['nonbinary', 'male', 'female'];
        }
      }
      if (userInput.locationName) {
        finalUserInput.matchingDemographics.locationName = { name: userInput.locationName };
        finalUserInput.matchingPreferences.locationName = { name: userInput.locationName };
      }
      const referralCode = await generateReferralCode(userInput.firstName);
      if (referralCode) {
        finalUserInput.referralCode = referralCode;
      }
      const createUserObj = createUserObject(finalUserInput)
        .catch(err => err);

      const createDiscoveryQueueObj = createDiscoveryQueueObject(
        {
          user_id: userObjectID,
          _id: discoveryQueueObjectID,
        },
      )
        .catch(err => err);

      return Promise.all([createUserObj, createDiscoveryQueueObj])
        .then(async ([userObject, discoveryQueueObject]) => {
          if (userObject instanceof Error
            || discoveryQueueObject instanceof Error) {
            debug('error occurred while creating user');
            let errorMessage = '';
            if (userObject instanceof Error) {
              errorMessage += userObject.toString();
            } else {
              userObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove user object${err}`);
                } else {
                  debug('Removed created user object successfully');
                }
              });
            }
            if (discoveryQueueObject instanceof Error) {
              errorMessage += discoveryQueueObject.toString();
            } else {
              discoveryQueueObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove discovery object${err}`);
                } else {
                  debug('Removed created discovery object successfully');
                }
              });
            }
            errorLog(errorMessage);
            return {
              success: false,
              message: CREATE_USER_ERROR,
            };
          }
          // initialize feed with some people
          const devMode = process.env.DEV === 'true';
          const regenTestDBMode = (process.env.REGEN_DB === 'true' && devMode);
          if (discoveryQueueObject.currentDiscoveryItems.length === 0 && !regenTestDBMode) {
            for (let i = 0; i < INITIALIZED_FEED_LENGTH; i += 1) {
              await updateDiscoveryWithNextItem({ userObj: userObject });
            }
          }
          return {
            success: true,
            user: userObject,
          };
        });
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
