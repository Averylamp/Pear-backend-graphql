import { createUserMatchesObject, UserMatches } from '../models/usermatchesmodel';
import { createDiscoveryQueueObject, DiscoveryQueue } from '../models/discoveryqueuemodel';
import { createUserObject, User } from '../models/usermodel';

const mongoose = require('mongoose');
const $ = require('mongo-dot-notation');
const debug = require('debug')('dev:UserResolvers');

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
  },
  User: {
    userMatchesObj: async ({ userMatches_id }) => UserMatches.findById(userMatches_id),
    discoveryQueueObj: async ({ discoveryQueue_id }) => DiscoveryQueue.findById(discoveryQueue_id),
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      debug(userInput);
      const userObjectID = mongoose.Types.ObjectId();
      const userMatchesObjectID = mongoose.Types.ObjectId();
      const disoveryQueueObjectID = mongoose.Types.ObjectId();
      debug(`IDs:${userObjectID}, ${userMatchesObjectID}, ${disoveryQueueObjectID}`);

      const finalUserInput = userInput;
      finalUserInput.userMatches_id = userMatchesObjectID;
      finalUserInput.discoveryQueue_id = disoveryQueueObjectID;
      const createUserObj = createUserObject(finalUserInput, userObjectID)
        .catch(err => err);

      const createUserMatchesObj = createUserMatchesObject(
        { user_id: userObjectID }, userMatchesObjectID,
      )
        .catch(err => err);

      const createDiscoveryQueueObj = createDiscoveryQueueObject(
        { user_id: userObjectID }, disoveryQueueObjectID,
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
    getUser: async (_source, { userInput }) => {
      debug(userInput);
      const idToken = userInput.firebaseToken;
      const uid = userInput.firebaseAuthID;
      return new Promise(resolve => firebaseAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          debug('Decoded token');
          const firebaseUID = decodedToken.uid;
          debug(firebaseUID);
          debug(uid);
          if (uid === firebaseUID) {
            debug('tokenUID matches provided UID');
            const user = User.findOne({ firebaseAuthID: uid });
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
    updateUser: async (_source, { id, updateUserInput }) => {
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
