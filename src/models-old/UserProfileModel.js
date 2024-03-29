import { dbOld } from '../migration1/Migration1Setup';

const mongoose = require('mongoose');

const { Schema } = mongoose;
// const $ = require('mongo-dot-notation');

const debug = require('debug')('dev:UserProfile');

const userProfileType = `
type UserProfile {
  _id: ID!
  creatorUser_id: ID!
  creatorObj: User
  creatorFirstName: String!
  user_id: ID!
  userObj: User

  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!

  firebaseChatDocumentID: String!
  firebaseChatDocumentPath: String!
}

`;

const editUserProfileType = `
input EditUserProfileInput {
  # id of the profile being edited
  _id: ID!
  # The creator's User Object ID
  creatorUser_id: ID!
  interests: [String!]
  vibes: [String!]
  bio: String
  dos: [String!]
  donts: [String!]
}
`;

const mutationRoutes = `
extend type Mutation {
  # edit the user profile. the creatorUser_id must be the creator of the profile
  editUserProfile(editUserProfileInput: EditUserProfileInput!): UserProfileMutationResponse

  # deletes the user profile. user_id must be either the underlying user or the creator
  deleteUserProfile(user_id: ID!, userProfile_id: ID!): UserProfileMutationResponse
}
`;

const userProfileMutationResponse = `
type UserProfileMutationResponse{
  success: Boolean!
  message: String
  userProfile: UserProfile
}
`;

const endorsementEdgeType = `
type EndorsementEdge {
  _id: ID!
  active: Boolean!
  otherUser_id: ID!
  otherUser: User
  
  myProfile_id: ID
  myProfile: UserProfile
  theirProfile_id: ID
  theirProfile: UserProfile
  
  firebaseChatDocumentID: String!
  firebaseChatDocumentPath: String!
}
`;

export const typeDef = userProfileType
  + editUserProfileType
  + mutationRoutes
  + userProfileMutationResponse
  + endorsementEdgeType;


const UserProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creatorUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  creatorFirstName: { type: String, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  interests: { type: [String], required: true },
  vibes: { type: [String], required: true },
  bio: { type: String, required: true },
  dos: { type: [String], required: true },
  donts: { type: [String], required: true },
  firebaseChatDocumentID: { type: String, required: true },
  firebaseChatDocumentPath: { type: String, required: true },
}, { timestamps: true });

export const EndorsementEdgeSchema = new Schema({
  active: { type: Schema.Types.Boolean, required: true, default: true },
  otherUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  myProfile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  theirProfile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  firebaseChatDocumentID: { type: String, required: true },
  firebaseChatDocumentPath: { type: String, required: true },
});


export const UserProfileOld = dbOld ? dbOld.model('UserProfile', UserProfileSchema) : null;

export const createUserProfileObject = function createUserProfileObject(userProfileInput) {
  const userProfileModel = new UserProfileOld(userProfileInput);
  return new Promise((resolve, reject) => {
    userProfileModel.save((err) => {
      if (err) {
        debug(err);
        reject(err);
      }
      resolve(userProfileModel);
    });
  });
};
