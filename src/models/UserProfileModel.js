import { ImageContainer } from './ImageSchemas';

const mongoose = require('mongoose');

const { Schema } = mongoose;
// const $ = require('mongo-dot-notation');

const debug = require('debug')('dev:UserProfile');

export const typeDef = `

extend type Mutation {
  createUserProfile(userProfileInput: CreationUserProfileInput): UserProfileMutationResponse
  updateUserProfile(id: ID, updateUserProfileInput: UpdateUserProfileInput) : UserProfileMutationResponse
}

input CreationUserProfileInput {
  creatorUser_id: ID!
  firstName: String!
  demographics: CreationUserProfileDemographicsInput!
  activeProfile: Boolean!
  activeDiscovery: Boolean!
}

input CreationUserProfileDemographicsInput {
  gender: Gender!
  age: Int!
}

input UpdateUserProfileInput {
  activeProfile: Boolean
  activeDiscovery: Boolean
  firstName: String
  lastName: String
  demographics: UpdateProfileDemographicsInput
  userProfileData: UpdateUserProfileDataInput
}

input UpdateProfileDemographicsInput {
  gender: Gender
  age: Int
  height: Int
  locationName: String
  locationCoordinates: String
  school: String
  ethnicities: [String!]
  religion: [String!]
  political: [String!]
  smoking: [String!]
  drinking: [String!]
}

input UpdateUserProfileDataInput{
  totalProfileViews: Int
  totalProfileLikes: Int
}

type UserProfileMutationResponse{
  success: Boolean!
  message: String
  userProfile: UserProfile
}

type UserProfile {
  _id: ID!
  creatorUser_id: ID!
  creatorObj: User!
  user_id: ID
  userObj: User
  
  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!

  images: [ImageContainer!]!
  userProfileData: UserProfileData!
}


type UserProfileData{
  totalProfileViews: Int!
  totalProfileLikes: Int!
}


`;


const UserProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creatorUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, required: false, index: true },
  interests: { type: [String], required: true },
  vibes: { type: [String], required: true },
  bio: { type: String, required: true },
  dos: { type: [String], required: true },
  donts: { type: [String], required: true },

  userProfileData: {
    totalProfileViews: {
      type: Number, required: true, min: 0, default: 0,
    },
    totalProfileLikes: {
      type: Number, required: true, min: 0, default: 0,
    },
  },

  images: { type: [ImageContainer], required: true, default: [ImageContainer] },

});


export const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

export const createUserProfileObject = function createUserProfileObject(userProfileInput) {
  const userProfileModel = new UserProfile(userProfileInput);
  debug(userProfileModel);
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
