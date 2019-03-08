import { ImageSizes } from './ImageSchemas';
import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const debug = require('debug')('dev:DetachedProfileResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');
// const $ = require('mongo-dot-notation');
//
// const debug = require('debug')('dev:DetachedProfile');

export const typeDef = `

extend type Query {
  findDetachedProfiles(user_id: ID): [DetachedProfile!]!
}

extend type Mutation{
  createDetachedProfile(detachedProfileInput: CreationDetachedProfileInput): DetachedProfileMutationResponse!
}


input CreationDetachedProfileInput {
  creatorUser_id: ID!
  firstName: String!
  phoneNumber: String!
  age: Int!
  gender: Gender!
  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!
  images: [CreateImageSizes!]!

}


type DetachedProfile {
  _id: ID!
  creatorUser_id: ID!
  firstName: String!
  phoneNumber: String!
  age: Int!
  gender: Gender!
  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!
  images: [ImageSizes!]!

  matchingDemographics: MatchingDemographics!
  matchingPreferencees: MatchingPreferences!
}

type DetachedProfileMutationResponse{
  success: Boolean!
  message: String
  detachedProfile: DetachedProfile
}

`;


const DetachedProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creatorUser_id: { type: String, required: true, index: true },
  firstName: { type: String, required: true },
  phoneNumber: {
    type: String,
    required: true,
    validate: { validator(v) { return /\d{10}$/.test(v); } },
    index: true,
  },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary'] },
  interests: { type: [String], required: true },
  vibes: { type: [String], required: true },
  bio: { type: String, required: true },
  dos: { type: [String], required: true },
  donts: { type: [String], required: true },
  images: { type: ImageSizes, required: true },
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

});


export const DetachedProfile = mongoose.model('DetachedProfile', DetachedProfileSchema);

export const createDetachedProfileObject = function
createUserProfileObject(detachedProfileInput) {
  const detachedProfileModel = new DetachedProfile(detachedProfileInput);
  debug(detachedProfileModel);
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


export const resolvers = {
  Query: {
    findDetachedProfiles: async (_, { user_id }) => {
      functionCallConsole('Find Detached Profile Called');
      debug(user_id);
    },
  },
  DetachedProfile: {

  },
  Mutation: {
    createDetachedProfile: async (_, { detachedProfileInput }) => {
      functionCallConsole('Create Detached Profile Called');
      debug(detachedProfileInput);
    },

  },
};
