import { DetachedProfile } from '../../models/DetachedProfile';
import { User } from '../../models/UserModel';
import {
  APPROVE_PROFILE_ERROR,
  CREATE_DETACHED_PROFILE_ERROR,
  DELETE_DETACHED_PROFILE_ERROR,
  EDIT_DETACHED_PROFILE_ERROR,
  GET_USER_ERROR,
  VIEW_DETACHED_PROFILE_ERROR,
  WRONG_CREATOR_ERROR,
} from '../ResolverErrorStrings';
import { deleteDetachedProfile } from '../../deletion/UserProfileDeletion';
import { createDetachedProfileResolver } from './CreateDetachedProfile';
import { approveDetachedProfileResolver } from './ApproveDetachedProfile';
import { getAndValidateUsersAndDetachedProfileObjects } from './DetachedProfileResolverUtils';
import { editDetachedProfileResolver } from './EditDetachedProfile';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { datadogStats } from '../../DatadogHelper';

const debug = require('debug')('dev:DetachedProfileResolvers');
const errorLog = require('debug')('error:DetachedProfileResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');

export const resolvers = {
  Query: {
    findDetachedProfiles: async (_, { phoneNumber }) => {
      functionCallConsole('Find Detached Profile Called');
      debug(`Looking for detached profiles for: ${phoneNumber}`);
      return DetachedProfile.find({
        phoneNumber,
        status: {
          $ne: 'accepted',
        },
      });
    },
  },
  DetachedProfile: {
    creatorUser: async ({ creatorUser_id }) => User.findById(creatorUser_id),
  },
  Mutation: {
    createDetachedProfile: async (_, { detachedProfileInput }) => {
      datadogStats.increment('server.stats.detached_profile_created');
      functionCallConsole('Create Detached Profile Called');
      try {
        return createDetachedProfileResolver({ detachedProfileInput });
      } catch (e) {
        errorLog(`error occurred creating detached profile: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'createDetachedProfile',
          args: { detachedProfileInput },
          errorMsg: e,
          errorName: CREATE_DETACHED_PROFILE_ERROR,
        });
        return {
          success: false,
          message: CREATE_DETACHED_PROFILE_ERROR,
        };
      }
    },
    viewDetachedProfile: async (_source, { user_id, detachedProfile_id }) => {
      functionCallConsole('View Detached Profile Called');
      try {
        await getAndValidateUsersAndDetachedProfileObjects({
          user_id,
          detachedProfile_id,
        });

        const updatedDetachedProfile = await DetachedProfile
          .findByIdAndUpdate(detachedProfile_id, {
            status: 'waitingSeen',
          }, { new: true })
          .exec();
        return {
          success: true,
          detachedProfile: updatedDetachedProfile,
        };
      } catch (e) {
        errorLog(`An error occurred viewing detached profile: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'viewDetachedProfile',
          args: { user_id, detachedProfile_id },
          errorMsg: e,
          errorName: VIEW_DETACHED_PROFILE_ERROR,
        });
        return {
          success: false,
          message: VIEW_DETACHED_PROFILE_ERROR,
        };
      }
    },
    editDetachedProfile: async (_source, { editDetachedProfileInput }) => {
      functionCallConsole('Edit Detached Profile Called');
      datadogStats.increment('server.stats.detached_profile_edited');
      try {
        return editDetachedProfileResolver({ editDetachedProfileInput });
      } catch (e) {
        errorLog(`error occurred editing detached profile: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'editDetachedProfileInput',
          args: { editDetachedProfileInput },
          errorMsg: e,
          errorName: EDIT_DETACHED_PROFILE_ERROR,
        });
        return {
          success: false,
          message: EDIT_DETACHED_PROFILE_ERROR,
        };
      }
    },
    approveNewDetachedProfile: async (_source, { approveDetachedProfileInput }) => {
      functionCallConsole('Approve Profile Called');
      datadogStats.increment('server.stats.detached_profile_approved');
      try {
        return approveDetachedProfileResolver({ approveDetachedProfileInput });
      } catch (e) {
        errorLog(`error occurred approving detached profile: ${e}`);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'approveDetachedProfileInput',
          args: { approveDetachedProfileInput },
          errorMsg: e,
          errorName: APPROVE_PROFILE_ERROR,
        });
        return {
          success: false,
          message: APPROVE_PROFILE_ERROR,
        };
      }
    },
    // TODO
    deleteDetachedProfile: async (_source, { creator_id, detachedProfile_id }) => {
      functionCallConsole('deleteDetachedProfile called');
      const creator = await User.findById(creator_id)
        .exec()
        .catch(err => err);
      if (!creator || creator instanceof Error) {
        return {
          success: false,
          message: GET_USER_ERROR,
        };
      }

      if (!creator.detachedProfile_ids.map(id => id.toString())
        .includes(detachedProfile_id.toString())) {
        return {
          success: false,
          message: WRONG_CREATOR_ERROR,
        };
      }

      try {
        return deleteDetachedProfile(detachedProfile_id);
      } catch (e) {
        return {
          success: false,
          message: DELETE_DETACHED_PROFILE_ERROR,
        };
      }
    },

  },
};
