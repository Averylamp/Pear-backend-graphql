import { DetachedProfile } from '../../models/DetachedProfile';
import {
  DiscoveryQueue,
} from '../../models/DiscoveryQueueModel';
import { User } from '../../models/UserModel';
import { Match } from '../../models/MatchModel';
import { EventModel } from '../../models/EventModel';
import { authenticateUser, sendNewMessagePushNotification } from '../../FirebaseManager';
import {
  ADD_EVENT_CODE_ERROR,
  CREATE_USER_ERROR, DELETE_USER_ERROR, DELETE_USER_PERMISSION_ERROR, EDIT_ENDORSEMENT_ERROR,
  GET_USER_ERROR, UPDATE_USER_ERROR, UPDATE_USER_PHOTOS_ERROR,
} from '../ResolverErrorStrings';
import { LAST_ACTIVE_ARRAY_LEN } from '../../constants';
import { createUserResolver } from './CreateUser';
import { updateUserResolver } from './UpdateUser';
import { editEndorsementResolver } from './EditEndorsement';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { deleteUserResolver } from '../../deletion/UserDeletion';
import { addEventCodeResolver } from './AddEventCode';
import { updateUserPhotosResolver } from './UpdateUserPhotos';
import { datadogStats } from '../../DatadogHelper';
import { recordActivity, recordSentMessage, UserActionSummary } from '../../models/UserActionModel';

const debug = require('debug')('dev:UserResolvers');
const errorLog = require('debug')('error:UserResolver');
const functionCallConsole = require('debug')('dev:FunctionCalls');

const devMode = process.env.DEV === 'true';

export const resolvers = {
  User: {
    discoveryQueueObj: async ({ discoveryQueue_id }) => DiscoveryQueue.findById(discoveryQueue_id),
    actionSummaryObj: async ({ actionSummary_id }) => UserActionSummary
      .findById(actionSummary_id),
    blockedUsers: async ({ blockedUser_ids }) => User.find({ _id: { $in: blockedUser_ids } }),
    requestedMatches: async ({ requestedMatch_ids }) => Match
      .find({ _id: { $in: requestedMatch_ids } }),
    currentMatches: async ({ currentMatch_ids }) => Match
      .find({ _id: { $in: currentMatch_ids } }),
    edgeUser_ids: async ({ edgeSummaries }) => [
      ...new Set(edgeSummaries.map(summary => summary.otherUser_id)),
    ],
    endorsers: async ({ endorser_ids }) => User.find({ _id: { $in: endorser_ids } }),
    endorsedUsers: async ({ endorsedUser_ids }) => User.find({ _id: { $in: endorsedUser_ids } }),
    detachedProfiles: async ({ detachedProfile_ids }) => DetachedProfile
      .find({ _id: { $in: detachedProfile_ids } }),
    events: async ({ event_ids }) => EventModel.find({ _id: { $in: event_ids } }),
  },
  Query: {
    user: async (_source, { id }) => {
      debug(`Getting user by id: ${id}`);
      return User.findById(id);
    },
    getUser: async (_source, args) => {
      const { userInput } = args;
      functionCallConsole('Get User Called');
      datadogStats.increment('server.call.get_user');
      const token = userInput.firebaseToken;
      const uid = userInput.firebaseAuthID;
      try {
        const authenticatedUID = await authenticateUser(uid, token);
        const user = await User.findOne({ firebaseAuthID: authenticatedUID })
          .exec();
        if (user) {
          const now = new Date();
          user.lastActive = now;
          if (now.getTime() - user.lastActiveTimes[user.lastActiveTimes.length - 1].getTime()
            > 60 * 60 * 1000) {
            user.lastActiveTimes.push(now);
            user.lastActiveTimes.slice(-1 * LAST_ACTIVE_ARRAY_LEN);
            recordActivity({ user });
          }
          user.save();
          return {
            success: true,
            user,
          };
        }
        generateSentryErrorForResolver({
          resolverType: 'query',
          routeName: 'getUser',
          args,
          errorName: GET_USER_ERROR,
        });
        return {
          success: false,
          message: GET_USER_ERROR,
        };
      } catch (e) {
        errorLog(`An error occurred getting user: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'query',
          routeName: 'getUser',
          args,
          errorName: GET_USER_ERROR,
          errorMsg: e,
        });
        return {
          success: false,
          message: GET_USER_ERROR,
        };
      }
    },
    getAllUsers: async () => {
      if (!devMode) {
        errorLog('can\'t call get all users from prod mode');
        return [];
      }
      try {
        const users = [];
        let count = 0;
        return new Promise((resolve) => {
          debug('Return all user promise');
          User.find({})
            .cursor()
            .on('data', (user) => {
              users.push(user);
              count += 1;
              if (count % 10 === 0) {
                debug(`Found: ${count} users`);
              }
            })
            .on('end', async () => {
              debug('got all users');
              resolve(users.filter(user => !!user));
            });
        });
      } catch (e) {
        errorLog(`An error occurred getting users: ${e}`);
        return [];
      }
    },
    notifyNewMessage: async (_source, { fromUser_id, toUser_id }) => {
      datadogStats.increment('server.stats.notification_user_received_new_message');
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
      recordSentMessage({ fromUser_id, toUser_id });
      return true;
    },
    alreadyOnPear: async (_source, { phoneNumbers }) => {
      try {
        const users = await User.find({ phoneNumber: { $in: phoneNumbers } }).exec();
        return users.map(user => user.phoneNumber);
      } catch (e) {
        return [];
      }
    },
    getUserCount: async () => 3 * (await User.find({})
      .countDocuments()
      .exec()),
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      functionCallConsole('Create User');
      datadogStats.increment('server.stats.new_user_created');
      try {
        return createUserResolver({ userInput });
      } catch (e) {
        errorLog(`error occurred while creating user: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'createUser',
          args: { userInput },
          errorMsg: e,
          errorName: CREATE_USER_ERROR,
        });
        return {
          success: false,
          message: CREATE_USER_ERROR,
        };
      }
    },
    updateUser: async (_source, { updateUserInput }) => {
      functionCallConsole('Update User');
      datadogStats.increment('server.stats.user_updated_information');
      try {
        return updateUserResolver({ updateUserInput });
      } catch (e) {
        errorLog(`error occurred while updating user: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'updateUser',
          args: { updateUserInput },
          errorMsg: e,
          errorName: UPDATE_USER_ERROR,
        });
        return {
          success: false,
          message: UPDATE_USER_ERROR,
        };
      }
    },
    updateUserPhotos: async (_source, { updateUserPhotosInput }) => {
      functionCallConsole('Update Photos Called');
      datadogStats.increment('server.stats.user_updated_photos');
      try {
        return updateUserPhotosResolver({ updateUserPhotosInput });
      } catch (e) {
        errorLog(`error occurred while updating photos: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'updateUserPhotos',
          args: { updateUserPhotosInput },
          errorMsg: e,
          errorName: UPDATE_USER_PHOTOS_ERROR,
        });
        return {
          success: false,
          message: UPDATE_USER_PHOTOS_ERROR,
        };
      }
    },
    editEndorsement: async (_source, { editEndorsementInput }) => {
      functionCallConsole('Edit Endorsement Called');
      datadogStats.increment('server.stats.user_updated_endorsement');
      try {
        return editEndorsementResolver({ editEndorsementInput });
      } catch (e) {
        errorLog(`error occurred while editing endorsement: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'editEndorsement',
          args: { editEndorsementInput },
          errorMsg: e,
          errorName: EDIT_ENDORSEMENT_ERROR,
        });
        return {
          success: false,
          message: EDIT_ENDORSEMENT_ERROR,
        };
      }
    },
    deleteUser: async (_source, { user_id }) => {
      if (!devMode) {
        return {
          success: false,
          message: DELETE_USER_PERMISSION_ERROR,
        };
      }
      try {
        return deleteUserResolver(user_id);
      } catch (e) {
        errorLog(`error occurred while attempting to delete user: ${e.toString()}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'deleteUser',
          args: { user_id },
          errorMsg: e,
          errorName: DELETE_USER_ERROR,
        });
        return {
          success: false,
          message: DELETE_USER_ERROR,
        };
      }
    },
    addEventCode: async (_source, { user_id, code }) => {
      try {
        return addEventCodeResolver({ user_id, code });
      } catch (e) {
        errorLog(`error occurred while attempting to add event code: ${e.toString()}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'addEventCode',
          args: { user_id, code },
          errorMsg: e,
          errorName: ADD_EVENT_CODE_ERROR,
        });
        return {
          success: false,
          message: ADD_EVENT_CODE_ERROR,
        };
      }
    },
    markHighQuality: async (_source, { user_id }) => {
      try {
        const user = await User.findById(user_id).exec();
        if (!user) {
          return {
            success: false,
            message: GET_USER_ERROR,
          };
        }
        user.seeded = true;
        user.lowQuality = false;
        const updatedUser = await user.save();
        return {
          success: true,
          user: updatedUser,
        };
      } catch (e) {
        errorLog(`error occurred while attempting to mark high quality: ${e.toString()}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'markHighQuality',
          args: { user_id },
          errorMsg: e,
          errorName: 'error marking high quality user',
        });
        return {
          success: false,
          message: 'error marking high quality user',
        };
      }
    },
    markLowQuality: async (_source, { user_id }) => {
      try {
        const user = await User.findById(user_id)
          .exec();
        if (!user) {
          return {
            success: false,
            message: GET_USER_ERROR,
          };
        }
        user.lowQuality = true;
        user.seeded = false;
        const updatedUser = await user.save();
        return {
          success: true,
          user: updatedUser,
        };
      } catch (e) {
        errorLog(`error occurred while attempting to mark low quality: ${e.toString()}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'markLowQuality',
          args: { user_id },
          errorMsg: e,
          errorName: 'error marking low quality user',
        });
        return {
          success: false,
          message: 'error marking low quality user',
        };
      }
    },
    markRegularQuality: async (_source, { user_id }) => {
      try {
        const user = await User.findById(user_id)
          .exec();
        if (!user) {
          return {
            success: false,
            message: GET_USER_ERROR,
          };
        }
        user.lowQuality = false;
        user.seeded = false;
        const updatedUser = await user.save();
        return {
          success: true,
          user: updatedUser,
        };
      } catch (e) {
        errorLog(`error occurred while attempting to mark regular quality: ${e.toString()}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'markRegularQuality',
          args: { user_id },
          errorMsg: e,
          errorName: 'error marking regular quality user',
        });
        return {
          success: false,
          message: 'error marking regular quality user',
        };
      }
    },
  },
};
