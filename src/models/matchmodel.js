const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `
type Match{
  _id: ID!
  matchRequest_id: ID!
  matchRequest_obj: MatchRequest
  firstPersonUser_id: ID!
  firstPersonUser_obj: User!
  firstPersonProfile_id: ID
  firstPersonProfile_obj: UserProfile
  secondPersonUser_id: ID!
  secondPersonUser_obj: User!
  secondPersonProfile_id: ID
  secondPersonProfile_obj: UserProfile
  timestampCreated: Int
  matchStats: MatchStats
  firebaseConversationDocumentID: String!
}

type MatchStats{
  conversationFirstMessageSent: Boolean!
  conversationTenMessagesSent: Boolean!
  conversationHundredMessagesSent: Boolean!
}
`;

export const resolvers = {
  Query: {

  },
  Match: {

  },
};

const MatchSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  matchRequest_id: { type: Schema.Types.ObjectId, required: true },
  firstPersonUser_id: { type: Schema.Types.ObjectId, required: true },
  firstPersonProfile_id: { type: Schema.Types.ObjectId, required: true },
  secondPersonUser_id: { type: Schema.Types.ObjectId, required: true },
  secondPersonProfile_id: { type: Schema.Types.ObjectId, required: true },
  timestampCreated: { type: Number, required: true },
  matchStats: {
    conversationFirstMessageSent: { type: Boolean, required: true, default: false },
    conversationTenMessagesSent: { type: Boolean, required: true, default: false },
    conversationHundredMessagesSent: { type: Boolean, required: true, default: false },
  },
  firebaseConversationDocumentID: { type: String, required: true },
});


// matchRequest_obj: MatchRequest
// firstPersonUser_obj: User!
// firstPersonProfile_obj: UserProfile!
// secondPersonUser_obj: User!
// secondPersonProfile_obj: UserProfile!
export const Match = mongoose.model('Match', MatchSchema);
