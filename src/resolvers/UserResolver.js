import { createUserMatchesObject, UserMatches } from '../models/UserMatchesModel';
import { createDiscoveryQueueObject, DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { createUserObject, User } from '../models/UserModel';

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
      return User.findOne(id);
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
    userMatchesObj: async ({ userMatches_id }) => UserMatches.findById(userMatches_id),
    discoveryQueueObj: async ({ discoveryQueue_id }) => DiscoveryQueue.findById(discoveryQueue_id),
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      functionCallConsole('Create User');
      const userObjectID = mongoose.Types.ObjectId();
      const userMatchesObjectID = mongoose.Types.ObjectId();
      const disoveryQueueObjectID = mongoose.Types.ObjectId();
      debug(`IDs:${userObjectID}, ${userMatchesObjectID}, ${disoveryQueueObjectID}`);

      const finalUserInput = userInput;
      finalUserInput.userMatches_id = userMatchesObjectID;
      finalUserInput.discoveryQueue_id = disoveryQueueObjectID;
      finalUserInput._id = userObjectID;
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
  },
};
