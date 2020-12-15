import { pick } from 'lodash';
import { createUserObject } from '../../models/UserModel';
import { createDiscoveryQueueObject } from '../../models/DiscoveryQueueModel';
import { CREATE_USER_ERROR } from '../ResolverErrorStrings';

const mongoose = require('mongoose');
const errorLog = require('debug')('error:CreateUserResolver');
const debug = require('debug')('dev:CreateUserResolver');

export const createUserResolver = async ({ userInput }) => {
  const userObjectID = '_id' in userInput ? userInput._id : mongoose.Types.ObjectId();
  const discoveryQueueObjectID = mongoose.Types.ObjectId();
  const userActionSummaryObjectID = mongoose.Types.ObjectId();

  const finalUserInput = pick(userInput, [
    'phoneNumber',
    'phoneNumberVerified',
    'firebaseToken',
    'firebaseAuthID',
    'firebaseRemoteInstanceID',
    'referredByCode',
  ]);
  const now = new Date();
  finalUserInput.lastActiveTimes = [now];
  finalUserInput.lastActive = now;
  finalUserInput._id = userObjectID;
  finalUserInput.discoveryQueue_id = discoveryQueueObjectID;
  finalUserInput.actionSummary_id = userActionSummaryObjectID;
  finalUserInput.matchingPreferences = {};
  finalUserInput.matchingDemographics = {};
  const createUserObj = createUserObject(finalUserInput)
    .catch((err) => err);

  const createDiscoveryQueueObj = createDiscoveryQueueObject(
    {
      user_id: userObjectID,
      _id: discoveryQueueObjectID,
    },
  )
    .catch((err) => err);

  return Promise.all([createUserObj, createDiscoveryQueueObj])
    .then(async ([userObject, discoveryQueueObject, userActionSummaryObject]) => {
      if (userObject instanceof Error
        || discoveryQueueObject instanceof Error
        || userActionSummaryObject instanceof Error) {
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
        if (userActionSummaryObject instanceof Error) {
          errorMessage += userActionSummaryObject.toString();
        } else {
          userActionSummaryObject.remove((err) => {
            if (err) {
              debug(`Failed to remove user action summary object ${err}`);
            } else {
              debug('Removed user action summary object successfully');
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
};
