import { User } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';
import { DELETE_USER_PROFILE_ERROR, GET_USER_ERROR } from './ResolverErrorStrings';
import { deleteUserProfile } from '../deletion/UserProfileDeletion';

const functionCallConsole = require('debug')('dev:FunctionCalls');

export const resolvers = {
  Mutation: {
    deleteUserProfile: async (_source, { user_id, userProfile_id }) => {
      functionCallConsole('deleteUserProfile called');
      const user = await User.findById(user_id)
        .exec()
        .catch(err => err);
      if (!user || user instanceof Error) {
        return {
          success: false,
          message: GET_USER_ERROR,
        };
      }
      if (!user.profile_ids.map(id => id.toString())
        .includes(userProfile_id.toString())
        && !user.endorsedProfile_ids.map(id => id.toString())
          .includes(userProfile_id.toString())) {
        return {
          success: false,
          message: DELETE_USER_PROFILE_ERROR,
        };
      }

      try {
        return deleteUserProfile(userProfile_id);
      } catch (e) {
        return {
          success: false,
          message: DELETE_USER_PROFILE_ERROR,
        };
      }
    },
  },
  UserProfile: {
    userObj: async ({ user_id }) => User.findById(user_id),
    creatorObj: async ({ creatorUser_id }) => User.findById(creatorUser_id),
  },
  EndorsementEdge: {
    otherUser: async ({ otherUser_id }) => User.findById(otherUser_id),
    myProfile: async ({ myProfile_id }) => UserProfile.findById(myProfile_id),
    theirProfile: async ({ theirProfile_id }) => UserProfile.findById(theirProfile_id),
  },
};
