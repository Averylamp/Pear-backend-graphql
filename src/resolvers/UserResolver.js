import { createUserMatchesObject, UserMatches } from '../models/UserMatchesModel';
import { createDiscoveryQueueObject, DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { createUserObject, User } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { DetachedProfile } from '../models/DetachedProfile';

const mongoose = require('mongoose');
const $ = require('mongo-dot-notation');
const debug = require('debug')('dev:UserResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');

const firebaseAdmin = require('firebase-admin');

const serviceAccount = require('../../pear-firebase-adminsdk.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://pear-59123.firebaseio.com',
});


export const resolvers = {
  Query: {
    user: async (_source, { id }) => {
      debug(`Getting user by id: ${id}`);
      return User.findById(id);
    },
    getUser: async (_source, { userInput }) => {
      functionCallConsole('Get User Called');
      const idToken = userInput.firebaseToken;
      const uid = userInput.firebaseAuthID;
      return new Promise(resolve => firebaseAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const firebaseUID = decodedToken.uid;
          if (uid === firebaseUID) {
            debug('token matches provided UID');
            const user = User.findOne({ firebaseAuthID: uid });
            if (user) {
              functionCallConsole('Validated');
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
          } else {
            debug('token does not match');
            resolve({
              success: false,
              message: 'Failed to fetch user',
            });
          }
        }).catch((error) => {
          debug('Failed to Decoded token');
          // Handle error
          debug(error);
          resolve({
            success: false,
            message: 'Failed to verify token',
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
        { user_id: userObjectID, _id: userMatchesObjectID },
      )
        .catch(err => err);

      const createDiscoveryQueueObj = createDiscoveryQueueObject(
        { user_id: userObjectID, _id: disoveryQueueObjectID },
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
        id, finalUpdateUserInput, { new: true, runValidators: true },
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
    approveNewDetachedProfile: async (_source, { user_id, detachedProfile_id }) => {
      functionCallConsole('Approve Profile Called');
      const user = await User.findById(user_id);
      if (!user) {
        return {
          success: false,
          message: `User with id ${user_id} does not exist`,
        };
      }
      const detachedProfile = DetachedProfile.findById(detachedProfile_id);
      if (!detachedProfile) {
        return {
          success: false,
          message: `Detached profile with id ${detachedProfile_id} does not exist`,
        };
      }
      const creator = await User.findById(detachedProfile.creatorUser_id);
      if (!creator) {
        return {
          success: false,
          message: `Creator with id ${detachedProfile.creatorUser_id} does not exist`,
        };
      } if (creator._id === user_id) {
        return {
          success: false,
          message: 'Can\'t create profile for yourself',
        };
      }
      const endorserIDs = await UserProfile.find({ user_id });
      if (detachedProfile.creatorUser_id in endorserIDs) {
        return {
          success: false,
          message: `User already has a profile created by ${detachedProfile.creatorUser_id}`,
        };
      }

      /*
      const profileId = mongoose.Types.ObjectId();
      const userProfileInput = {
        _id: profileId,
        creatorUser_id: creator._id,
        user_id,
        interests: detachedProfile.interests,
        vibes: detachedProfile.vibes,
        bios: detachedProfile.bios,
        dos: detachedProfile.dos,
        donts: detachedProfile.donts,
      };

      const createUserProfileResult = createUserProfileObject(userProfileInput)
        .catch(err => err);
        */

      return null;
    },
  },
};
