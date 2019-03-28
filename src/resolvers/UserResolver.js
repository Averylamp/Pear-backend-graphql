import { pick } from 'lodash';
import { DetachedProfile } from '../models/DetachedProfile';
import { DiscoveryQueue, createDiscoveryQueueObject } from '../models/DiscoveryQueueModel';
import { User, createUserObject } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { Match } from '../models/MatchModel';
import { authenticateUser } from '../FirebaseManager';
import {
  CREATE_USER_ERROR,
  GET_USER_ERROR,
  UPDATE_USER_PHOTOS_ERROR,
} from './ResolverErrorStrings';

const mongoose = require('mongoose');
const debug = require('debug')('dev:UserResolvers');
const errorLog = require('debug')('error:UserResolver');
const functionCallConsole = require('debug')('dev:FunctionCalls');


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
        'thumbnailURL']);
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
      if (userInput.locationName) {
        finalUserInput.matchingDemographics.locationName = { name: userInput.locationName };
        finalUserInput.matchingPreferences.locationName = { name: userInput.locationName };
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
        .then(([userObject, discoveryQueueObject]) => {
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
          return {
            success: true,
            user: userObject,
          };
        });
    },
    updateUser: async () => null,
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

      return User.findByIdAndUpdate(user_id, {
        displayedImages,
        $push: {
          bankImages: {
            $each: toAddToImageBank,
          },
        },
      }, { new: true })
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
