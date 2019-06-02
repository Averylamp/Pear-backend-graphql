import { pick } from 'lodash';
import { createUserObject } from '../../models/UserModel';
import { createDiscoveryQueueObject } from '../../models/DiscoveryQueueModel';
import { CREATE_USER_ERROR } from '../ResolverErrorStrings';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { postCreateUser } from '../../SlackHelper';

const mongoose = require('mongoose');
const errorLog = require('debug')('error:CreateUserResolver');
const debug = require('debug')('dev:CreateUserResolver');

export const createUserResolver = async ({ userInput }) => {
  const userObjectID = '_id' in userInput ? userInput._id : mongoose.Types.ObjectId();
  const discoveryQueueObjectID = mongoose.Types.ObjectId();

  const finalUserInput = pick(userInput, [
    'phoneNumber',
    'phoneNumberVerified',
    'firebaseToken',
    'firebaseAuthID',
    'firebaseRemoteInstanceID',
    'referredByCode',
  ]);
  finalUserInput.lastActiveTimes = [new Date()];
  finalUserInput._id = userObjectID;
  finalUserInput.discoveryQueue_id = discoveryQueueObjectID;
  finalUserInput.matchingPreferences = {};
  finalUserInput.matchingDemographics = {};
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
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'createUser',
          args: { userInput },
          errorMsg: errorMessage,
          errorName: CREATE_USER_ERROR,
        });
        return {
          success: false,
          message: CREATE_USER_ERROR,
        };
      }
      try {
        postCreateUser({
          userPhone: userObject.phoneNumber,
        });
      } catch (err) {
        errorLog(err);
      }
      return {
        success: true,
        user: userObject,
      };
    });
};
