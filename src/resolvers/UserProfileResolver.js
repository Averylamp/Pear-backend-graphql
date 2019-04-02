import { User } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';

export const resolvers = {
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
