const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `
type MatchRequest{
  _id: ID!

  globalOneLiner: String
  firstPersonMessageRequest: String
  secondPersonMessageRequest: String

  endorserCreated: Boolean!
  firstPersonEndorserUser_id: ID
  firstPersonEndorserUserObj: User
  secondPersonEndorserUser_id: ID
  secondPersonEndorserUserObj: User

  firstPersonUser_id: ID!
  firstPersonUserObj: User!
  firstPersonProfile_id: ID
  firstPersonProfileObj: UserProfile
  secondPersonUser_id: ID!
  secondPersonUserObj: User!
  secondPersonProfile_id: ID
  secondPersonProfileObj: UserProfile

  timestampCreated: Int!
  firstPersonResponse: MatchResponse
  firstPersonResponseTimestamp: Int
  secondPersonResponse: MatchResponse
  secondPersonResponseTimestamp: Int

  matchStatus: MatchStatus!
  matchStatusTimestamp: Int!
  matchCreated: Boolean!
  acceptedMatch_id: ID
  acceptedMatchObj: Match
}

enum MatchStatus{
  requests
  rejected
  accepted
}

enum MatchResponse{
  unseen
  seen
  rejected
  accepted
}

`;

export const resolvers = {
  Query: {

  },
  MatchRequest: {

  },
};

const MatchRequestSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },

  globalOneLiner: { type: String, required: false },
  firstPersonMessageRequest: { type: String, required: false },
  secondPersonMessageRequest: { type: String, required: false },

  endorserCreated: { type: Boolean, required: true, default: false },
  firstPersonEndorserUser_id: { type: Schema.Types.ObjectId, required: false, index: true },
  secondPersonEndorserUser_id: { type: Schema.Types.ObjectId, required: false, index: true },

  firstPersonUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  firstPersonProfile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  secondPersonUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  secondPersonProfile_id: { type: Schema.Types.ObjectId, required: false, index: true },

  timestampCreated: { type: Number, required: true },
  firstPersonResponse: { type: String, required: true, enum: ['unseen', 'seen', 'rejected', 'accepted'] },
  firstPersonResponseTimestamp: { type: Number, required: true },
  secondPersonResponse: { type: String, required: true, enum: ['unseen', 'seen', 'rejected', 'accepted'] },
  secondPersonResponseTimestamp: { type: Number, required: true },
  matchStatus: { type: String, required: true, enum: ['request', 'rejected', 'accepted'] },
  matchStatusTimestamp: { type: Number, required: true },
  matchCreated: { type: Boolean, required: true, default: false },
  acceptedMatch_id: { type: Schema.Types.ObjectId, required: false, index: true },
}, { timestamps: true });


// firstPersonEndorserUserObj: User!
// secondPersonEndorserUserObj: User!
// firstPersonUserObj: User!
// firstPersonProfileObj: UserProfile!
// secondPersonUserObj: User!
// secondPersonProfileObj: UserProfile!
// acceptedMatchObj: Match
export const MatchRequest = mongoose.model('MatchRequest', MatchRequestSchema);
