import { User } from '../models/UserModel';

export const resolvers = {
  Query: {},
  Mutation: {},
  ImageContainer: {
    uploadedByUser: async ({ uploadedByUser_id }) => User.findById(uploadedByUser_id),
  },
};
