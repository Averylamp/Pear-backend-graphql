const mongoose = require('mongoose');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # Get a user by ID
  match(id: ID!): Match
}
`;

const mutationRoutes = `
extend type Mutation {
  # Creates Match Request between Users
  createMatchRequest(requestInput: CreateMatchRequestInput!): MatchMutationResponse!

  # TODO: Document
  viewRequest(user_id: ID!, match_id: ID!): MatchMutationResponse!

  # TODO: Document
  acceptRequest(user_id: ID!, match_id: ID!): MatchMutationResponse!

  # TODO: Document
  rejectRequest(user_id: ID!, match_id: ID!): MatchMutationResponse!

  # TODO: Document
  unmatch(user_id: ID!, match_id: ID!, reason: String): MatchMutationResponse!
}
`;

const createRequestMutationInputs = `
input CreateMatchRequestInput {
  _id: ID # only for testing

  # Either Matchmaker ID or User ID if personal request
  sentByUser_id: ID!

  # Always primary user
  sentForUser_id: ID!

  # Discovered user receiving the request
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

const edgeSummaryType = `
type EdgeSummary {
  _id: ID!
  otherUser_id: ID!
  edgeStatus: EdgeStatus!
  lastStatusChange: String!
  match_id: ID!
  match: Match
}

enum EdgeStatus{
  open
  rejected
  match
  unmatched
}

`;


export const typeDef = queryRoutes
  + mutationRoutes
  + createRequestMutationInputs
  + mutationResponse
  + requestResponseEnum
  + matchType
  + edgeSummaryType;

const MatchSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  sentByUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  sentForUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  receivedByUser_id: { type: Schema.Types.ObjectId, required: true, index: true },

  sentForUserStatus: {
    type: String,
    required: true,
    enum: ['unseen', 'seen', 'rejected', 'accepted'],
    default: 'unseen',
  },
  sentForUserStatusLastUpdated: { type: Date, required: true, default: Date },
  receivedByUserStatus: {
    type: String,
    required: true,
    enum: ['unseen', 'seen', 'rejected', 'accepted'],
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
    enum: ['open', 'rejected', 'match', 'unmatched'],
    default: 'open',
  },
  lastStatusChange: { type: Date, required: true, default: Date },
  match_id: { type: Schema.Types.ObjectId, required: true, index: true },
}, { timestamps: true });

export const Match = mongoose.model('Match', MatchSchema);

export const createMatchObject = matchInput => (new Match(matchInput)).save();
