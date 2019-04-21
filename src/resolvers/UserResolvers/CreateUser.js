import { pick } from 'lodash';
import { createUserObject } from '../../models/UserModel';
import { createDiscoveryQueueObject } from '../../models/DiscoveryQueueModel';
import { CREATE_USER_ERROR } from '../ResolverErrorStrings';
import { INITIALIZED_FEED_LENGTH } from '../../constants';
import {
  updateDiscoveryForUserById,
  updateDiscoveryWithNextItem,
} from '../../discovery/DiscoverProfile';

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
  finalUserInput.lastActive = [new Date()];
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
          try {
            await updateDiscoveryForUserById({ user_id: userObjectID });
          } catch (e) {
            errorLog(`Error updating discovery: ${e}`);
          }
        }
      }
      return {
        success: true,
        user: userObject,
      };
    });
};
