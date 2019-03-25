import { pick } from 'lodash';
import { DetachedProfile } from '../models/DetachedProfile';
import { DiscoveryQueue, createDiscoveryQueueObject } from '../models/DiscoveryQueueModel';
import { User, createUserObject } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { Match } from '../models/MatchModel';
import { authenticateUser } from '../FirebaseManager';

const mongoose = require('mongoose');
const debug = require('debug')('dev:UserResolvers');
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
              message: 'Successfully fetched',
              user,
            });
          } else {
            resolve({
              success: false,
              message: 'Failed to fetch user',
            });
          }
        })
        .catch((err) => {
          resolve({
            success: false,
            message: err.toString(),
          });
        }));
    },
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      functionCallConsole('Create User');
      const userObjectID = '_id' in userInput ? userInput._id : mongoose.Types.ObjectId();
      const disoveryQueueObjectID = mongoose.Types.ObjectId();

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
      finalUserInput.discoveryQueue_id = disoveryQueueObjectID;
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
          _id: disoveryQueueObjectID,
        },
      )
        .catch(err => err);

      return Promise.all([createUserObj, createDiscoveryQueueObj])
        .then(([userObject, discoveryQueueObject]) => {
          if (userObject instanceof Error
            || discoveryQueueObject instanceof Error) {
            debug('error occurred while creating user');
            let message = '';
            if (userObject instanceof Error) {
              message += userObject.toString();
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
              message += discoveryQueueObject.toString();
            } else {
              discoveryQueueObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove discovery object${err}`);
                } else {
                  debug('Removed created discovery object successfully');
                }
              });
            }
            return {
              success: false,
              message,
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
      debug(`input object is ${updateUserPhotosInput}`);
      const { user_id, displayedImages, additionalImages } = updateUserPhotosInput;
      const user = await User.findById(user_id);
      if (!user) {
        return {
          success: false,
          message: `User with id ${user_id} does not exist`,
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
        .catch(err => ({
          success: false,
          message: `Failed to update user with new photos: ${err}`,
        }));
    },
  }
  ,
};
