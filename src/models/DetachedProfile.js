import { ImageContainerSchema } from './ImageSchemas';
import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';


const mongoose = require('mongoose');

const { Schema } = mongoose;

const debug = require('debug')('dev:DetachedProfile');

const queryRoutes = `
extend type Query {
  # Queries for existing detached profiles
  findDetachedProfiles(phoneNumber: String): [DetachedProfile!]!
}
`;

const mutationRoutes = `
extend type Mutation{
  # Creates a new detached profile and attaches it to the creator's profile
  createDetachedProfile(detachedProfileInput: CreationDetachedProfileInput): DetachedProfileMutationResponse!
  # Changes the status of the detached profile from waitingSeen to waitingUnseen
  viewDetachedProfile(user_id: ID! detachedProfile_id: ID!): DetachedProfileMutationResponse!
  # Deletes the existing detached profile, converts it into a User Profile and attaches the user profile to both the creator's and user's User Object
  approveNewDetachedProfile(user_id: ID!, detachedProfile_id: ID!, creatorUser_id: ID!): UserMutationResponse!
}
`;

const createDetachedProfileInput = `
input CreationDetachedProfileInput {
  _id: ID
  # The creator's User Object ID
  creatorUser_id: ID!
  creatorFirstName: String!
  firstName: String!
  phoneNumber: String!
  age: Int!
  gender: Gender!
  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!
  images: [CreateImageContainer!]!
  location: [Float!]!
  locationName: String
}
`;

const detachedProfileType = `
type DetachedProfile {
  _id: ID!
  status: DetachedProfileStatus!
  creatorUser_id: ID!
  creatorUser: User
  creatorFirstName: String!
  firstName: String!
  phoneNumber: String!
  age: Int!
  gender: Gender!
  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!
  images: [ImageContainer!]!

  matchingDemographics: MatchingDemographics!
  matchingPreferences: MatchingPreferences!
}

enum DetachedProfileStatus {
  waitingUnseen
  waitingSeen
  declined
  accepted
}
`;

const detachedProfileMutationResponse = `
type DetachedProfileMutationResponse{
  success: Boolean!
  message: String
  detachedProfile: DetachedProfile
}
`;

export const typeDef = queryRoutes
+ mutationRoutes
+ createDetachedProfileInput
+ detachedProfileType
+ detachedProfileMutationResponse;


const DetachedProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  status: {
    type: String, required: true, enum: ['waitingUnseen', 'waitingSeen', 'declined', 'accepted'], default: 'waitingUnseen',
  },
  creatorUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  creatorFirstName: { type: String, required: true },
  firstName: { type: String, required: true },
  phoneNumber: {
    type: String,
    required: true,
    validate: { validator(v) { return /\d{10}$/.test(v) && v.length === 10; } },
    index: true,
  },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary'] },
  interests: { type: [String], required: true, default: [] },
  vibes: { type: [String], required: true, default: [] },
  bio: { type: String, required: true, default: '' },
  dos: { type: [String], required: true, default: [] },
  donts: { type: [String], required: true, default: [] },
  images: { type: [ImageContainerSchema], required: true, default: [] },
  matchingDemographics: {
    type: MatchingDemographicsSchema,
    required: true,
    default: MatchingDemographicsSchema,
  },
  matchingPreferences: {
    type: MatchingPreferencesSchema,
    required: true,
    default: MatchingPreferencesSchema,
  },

}, { timestamps: true });


export const DetachedProfile = mongoose.model('DetachedProfile', DetachedProfileSchema);

export const createDetachedProfileObject = function
createUserProfileObject(detachedProfileInput) {
  const detachedProfileModel = new DetachedProfile(detachedProfileInput);
  return new Promise((resolve, reject) => {
    detachedProfileModel.save((err) => {
      if (err) {
        debug(err);
        reject(err);
      }
      resolve(detachedProfileModel);
    });
  });
};
