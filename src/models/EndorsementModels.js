const mongoose = require('mongoose');

const { Schema } = mongoose;
// const $ = require('mongo-dot-notation');

const debug = require('debug')('dev:EndorsementModels');

// TODO: populate fields of EditEndorsementInput
const editEndorsementType = `
input EditEndorsementInput {
  # id of the user editing
  creatorUser_id: ID!
  # The endorsed user's id
  endorsedUser_id: ID!
}
`;

const mutationRoutes = `
extend type Mutation {
  # edit the user profile. the creatorUser_id must be the creator of the profile
  editEndorsement(editEndorsementInput: EditEndorsementInput!): EndorsementMutationResponse

  # deletes the user profile. user_id must be either the underlying user or the creator
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

export const typeDef = editEndorsementType
  + mutationRoutes
  + endorsementMutationResponse
  + endorsementEdgeType;

export const EndorsementEdgeSchema = new Schema({
  active: { type: Schema.Types.Boolean, required: true, default: true },
  otherUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  myProfile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  theirProfile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  firebaseChatDocumentID: { type: String, required: true },
  firebaseChatDocumentPath: { type: String, required: true },
});
