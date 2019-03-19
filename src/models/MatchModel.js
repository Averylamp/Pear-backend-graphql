const mongoose = require('mongoose');

const { Schema } = mongoose;

const mutationRoutes = `
extend type Mutation {
  matchmakerCreateRequest(requestInput: MatchmakerCreateRequestInput!): MatchMutationResponse!
  personalCreateRequest(requestInput: PersonalCreateRequestInput!): MatchMutationResponse!
  viewRequest(user_id: ID!, match_id: ID!): MatchMutationResponse!
  acceptRequest(user_id: ID!, match_id: ID!): MatchMutationResponse!
  rejectRequest(user_id: ID!, match_id: ID!): MatchMutationResponse!
  unmatch(user_id: ID!, match_id: ID!): MatchMutationResponse!
}
`;

const createRequestMutationInputs = `
input MatchmakerCreateRequestInput {
  matchmakerUser_id: ID!
  sentForUser_id: ID!
  receivedByUser_id: ID!
}

input PersonalCreateRequestInput {
  sentForUser_id: ID!
  receivedByUser_id: ID!
}
`;

const mutationResponse = `
type MatchMutationResponse {
  success: Boolean!
  message: String
  match: Match
}
`;

const requestResponseEnum = `
enum RequestResponse {
  unseen
  seen
  rejected
  accepted
}
`;

const matchType = `
type Match{
  _id: ID!
  
  sentByUser_id: ID!
  sentByUser: User
  sentForUser_id: ID!
  sentForUser: User
  receivedByUser_id: ID!
  receivedByUser: User
  
  sentForUserStatus: RequestResponse!
  sentForUserStatusLastUpdated: String!
  receivedByUserStatus: RequestResponse!
  receivedByUserStatusLastUpdated: String!
  
  unmatched: Boolean!
  unmatchedBy_id: ID
  unmatchedReason: String
  unmatchedTimestamp: String
  
  firebaseChatDocumentID: String!
}
`;

export const typeDef = mutationRoutes
  + createRequestMutationInputs
  + mutationResponse
  + requestResponseEnum
  + matchType;

const MatchSchema = new Schema({
  sentByUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  sentForUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  receivedByUser_id: { type: Schema.Types.ObjectId, required: true, index: true },

  sentForUserStatus: {
    type: String,
    required: true,
    enum: ['unseen, seen, rejected, accepted'],
    default: 'unseen',
  },
  sentForUserStatusLastUpdated: { type: Date, required: true, default: Date },
  receivedByUserStatus: {
    type: String,
    required: true,
    enum: ['unseen, seen, rejected, accepted'],
    default: 'unseen',
  },
  receivedByUserStatusLastUpdated: { type: Date, required: true, default: Date },

  unmatched: { type: Boolean, required: true, default: false },
  unmatchedBy_id: { type: Schema.Types.ObjectId, required: false },
  unmatchedReason: { type: String, required: false },
  unmatchedTimestamp: { type: Date, required: false },

  firebaseChatDocumentID: { type: String, required: true },
}, { timestamps: true });

export const EdgeSummarySchema = new Schema({
  otherUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  edgeStatus: {
    type: String,
    required: true,
    enum: ['open, rejected, match, unmatched'],
    default: 'open',
  },
  lastStatusChange: { type: Date, required: true, default: Date },
  match_id: { type: Schema.Types.ObjectId, required: true, index: true },
}, { timestamps: true });

export const Match = mongoose.model('Match', MatchSchema);
