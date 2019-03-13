const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `

type Match{
  _id: ID!
  matchRequest_id: ID!
  matchRequestObj: MatchRequest
  firstPersonUser_id: ID!
  firstPersonUserObj: User!
  firstPersonProfile_id: ID
  firstPersonProfileObj: UserProfile
  secondPersonUser_id: ID!
  secondPersonUserObj: User!
  secondPersonProfile_id: ID
  secondPersonProfileObj: UserProfile
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
}, { timestamps: true });


// matchRequestObj: MatchRequest
// firstPersonUserObj: User!
// firstPersonProfileObj: UserProfile!
// secondPersonUserObj: User!
// secondPersonProfileObj: UserProfile!
export const Match = mongoose.model('Match', MatchSchema);
