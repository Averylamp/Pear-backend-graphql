
import { User } from '../models/UserModel';
import { UserProfile } from '../models/UserProfileModel';


export const resolvers = {
  Query: {

  },
  DiscoveryQueue: {
    user: async ({ user_id }) => User.findById(user_id),
  },
  DiscoveryItem: {
    user: async ({ user_id }) => UserProfile.findById(user_id),
    userProfile: async ({ userProfile_id }) => User.findById(userProfile_id),
  },
};
