import { User } from '../models/UserModel';

export const resolvers = {
  Mutation: {
    matchmakerCreateRequest: async () => {},
    personalCreateRequest: async () => {},
    viewRequest: async () => {},
    acceptRequest: async () => {},
    rejectRequest: async () => {},
    unmatch: async () => {},
  },
  Match: {
    sentByUser: async ({ sentByUser_id }) => User.findById(sentByUser_id),
    sentForUser: async ({ sentForUser_id }) => User.findById(sentForUser_id),
    receivedByUser: async ({ receivedByUser_id }) => User.findById(receivedByUser_id),
  },
};
