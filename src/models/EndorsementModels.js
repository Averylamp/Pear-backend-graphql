const mongoose = require('mongoose');

const { Schema } = mongoose;
// const $ = require('mongo-dot-notation');

const mutationRoutes = `
extend type Mutation {
  # deletes all content made by endorser for user. user_id must be either the underlying user or
  # the creator
  deleteEndorsement(creatorUser_id: ID!, endorsedUser_id: ID!): EndorsementMutationResponse
}
`;

const endorsementMutationResponse = `
type EndorsementMutationResponse{
  success: Boolean!
  message: String
}
`;

const endorsementEdgeType = `
type EndorsementEdge {
  _id: ID!
  active: Boolean!
  otherUser_id: ID!
  otherUser: User
  
  firebaseChatDocumentID: String!
  firebaseChatDocumentPath: String!
}
`;

export const typeDef = mutationRoutes
  + endorsementMutationResponse
  + endorsementEdgeType;

export const EndorsementEdgeSchema = new Schema({
  active: { type: Schema.Types.Boolean, required: true, default: true },
  otherUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  firebaseChatDocumentID: { type: String, required: true },
  firebaseChatDocumentPath: { type: String, required: true },
}, { timestamps: true });
