import { ImageContainerSchema } from './ImageSchemas';
import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';


const mongoose = require('mongoose');

const { Schema } = mongoose;

const debug = require('debug')('dev:DetachedProfile');

export const typeDef = `

extend type Query {
  findDetachedProfiles(phoneNumber: String): [DetachedProfile!]!
}

extend type Mutation{
  createDetachedProfile(detachedProfileInput: CreationDetachedProfileInput): DetachedProfileMutationResponse!
}


input CreationDetachedProfileInput {
  _id: ID
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

}

input PhoneNumberInput{
  phoneNumber: String!
}


type DetachedProfile {
  _id: ID!
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

type DetachedProfileMutationResponse{
  success: Boolean!
  message: String
  detachedProfile: DetachedProfile
}

`;


const DetachedProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
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

});


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
