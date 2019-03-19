import nanoid from 'nanoid';
import { User } from '../models/UserModel';
import { createMatchObject } from '../models/MatchModel';

const makeFirebaseDocumentID = (length = 20) => nanoid(length);

export const resolvers = {
  Mutation: {
    matchmakerCreateRequest: async (_source, { requestInput }) => {
      const matchInput = {
        sentByUser_id: requestInput.matchmakerUser_id,
        sentForUser_id: requestInput.sentForUser_id,
        receivedByUser_id: requestInput.receivedByUser_id,
        firebaseChatDocumentID: makeFirebaseDocumentID()
      };
      createMatchObject(matchInput);
    },
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
