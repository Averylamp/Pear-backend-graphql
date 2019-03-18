import { authenticateUser } from './Authentication';
import { DetachedProfile } from '../models/DetachedProfile';
import { DiscoveryQueue, createDiscoveryQueueObject } from '../models/DiscoveryQueueModel';
import { User, createUserObject } from '../models/UserModel';
import { UserMatches, createUserMatchesObject } from '../models/UserMatchesModel';
import { UserProfile } from '../models/UserProfileModel';

const mongoose = require('mongoose');
const $ = require('mongo-dot-notation');
const debug = require('debug')('dev:UserResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');


export const resolvers = {
  Query: {
    user: async (_source, { id }) => {
      debug(`Getting user by id: ${id}`);
      return User.findById(id);
    },
    getUser: async (_source, { userInput }) => {
      functionCallConsole('Get User Called');
      const token = userInput.firebaseToken;
      const uid = userInput.firebaseAuthID;
      return new Promise(resolve => authenticateUser(uid, token).then((authenticatedUID) => {
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
      }).catch((err) => {
        resolve({
          success: false,
          message: err.toString(),
        });
      }));
    },
  },
  User: {
    profileObjs: async ({ profile_ids }) => UserProfile.find({ _id: { $in: profile_ids } }),
    endorsedProfileObjs: async ({ endorsedProfile_ids }) => UserProfile
      .find({ _id: { $in: endorsedProfile_ids } }),
    detachedProfileObjs: async ({ detachedProfile_ids }) => DetachedProfile
      .find({ _id: { $in: detachedProfile_ids } }),
    userMatchesObj: async ({ userMatches_id }) => UserMatches.findById(userMatches_id),
    discoveryQueueObj: async ({ discoveryQueue_id }) => DiscoveryQueue.findById(discoveryQueue_id),
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      functionCallConsole('Create User');
      const userObjectID = '_id' in userInput ? userInput._id : mongoose.Types.ObjectId();
      const userMatchesObjectID = mongoose.Types.ObjectId();
      const disoveryQueueObjectID = mongoose.Types.ObjectId();
      debug(`IDs:${userObjectID}, ${userMatchesObjectID}, ${disoveryQueueObjectID}`);

      const finalUserInput = userInput;
      finalUserInput._id = userObjectID;
      finalUserInput.userMatches_id = userMatchesObjectID;
      finalUserInput.discoveryQueue_id = disoveryQueueObjectID;
      const createUserObj = createUserObject(finalUserInput)
        .catch(err => err);

      const createUserMatchesObj = createUserMatchesObject(
        {
          user_id: userObjectID,
          _id: userMatchesObjectID,
        },
      )
        .catch(err => err);

      const createDiscoveryQueueObj = createDiscoveryQueueObject(
        {
          user_id: userObjectID,
          _id: disoveryQueueObjectID,
        },
      )
        .catch(err => err);

      return Promise.all([createUserObj, createUserMatchesObj, createDiscoveryQueueObj])
        .then(([userObject, userMatchesObject, discoveryQueueObject]) => {
          if (userObject instanceof Error
            || userMatchesObject instanceof Error
            || discoveryQueueObject instanceof Error) {
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
            if (userMatchesObject instanceof Error) {
              message += userMatchesObject.toString();
            } else {
              userMatchesObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove user matches object${err}`);
                } else {
                  debug('Removed created user matches object successfully');
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
    updateUser: async (_source, { id, updateUserInput }) => {
      functionCallConsole('Update User Called');
      const finalUpdateUserInput = $.flatten(updateUserInput);
      return new Promise(resolve => User.findByIdAndUpdate(
        id, finalUpdateUserInput, {
          new: true,
          runValidators: true,
        },
        (err, user) => {
          if (err) {
            resolve({
              success: false,
              message: err.toString(),
            });
          } else {
            resolve({
              success: true,
              user,
              message: 'Successfully updated',
            });
          }
        },
      ));
    },
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
