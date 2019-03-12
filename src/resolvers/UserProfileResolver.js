import { User } from '../models/UserModel';

export const resolvers = {
  Query: {},
  Mutation: {},
  UserProfile: {
    userObj: async ({ user_id }) => User.findById(user_id),
    creatorObj: async ({ creatorUser_id }) => User.findById(creatorUser_id),
  },
};
