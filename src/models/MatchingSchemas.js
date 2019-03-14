
const mongoose = require('mongoose');

const { Schema } = mongoose;

const matchingDemographicsType = `
type MatchingDemographics{
  gender: Gender!
  age: Int!
  birthdate: String!
  height: Int
  religion: [String!]
  ethnicities: [String!]
  political: [String!]
  smoking: [String!]
  drinking: [String!]
  school: String
}
`;

const matchingPreferencesType = `
type MatchingPreferences{
  ethnicities: [String!]
  seekingGender: [Gender!]!
  seekingReason: [String!]
  reasonDealbreaker: Int!
  seekingEthnicity: [String!]!
  ethnicityDealbreaker: Int!
  maxDistance: Int!
  distanceDealbreaker: Int!
  minAgeRange: Int!
  maxAgeRange: Int!
  ageDealbreaker: Int!
  minHeightRange: Int!
  maxHeightRange: Int!
  heightDealbreaker: Int!
}
`;

export const typeDef = matchingDemographicsType + matchingPreferencesType;

export const MatchingDemographicsSchema = new Schema({
  ethnicities: { type: [String], required: false },
  religion: { type: [String], required: false },
  political: { type: [String], required: false },
  smoking: { type: [String], required: false },
  drinking: { type: [String], required: false },
  height: { type: Number, required: false },
}, { timestamps: true });


export const MatchingPreferencesSchema = new Schema({
  ethnicities: { type: [String], required: true, default: ['No Preference'] },
  seekingGender: {
    type: [String], required: true, enum: ['male', 'female', 'nonbinary'], default: ['male', 'female', 'nonbinary'],
  },
  seekingReason: { type: [String], required: true, default: ['No Preference'] },
  reasonDealbreaker: {
    type: Number, required: true, min: 0, max: 1, default: 0,
  },
  seekingEthnicity: { type: [String], required: true, default: ['No Preference'] },
  ethnicityDealbreaker: {
    type: Number, required: true, min: 0, max: 1, default: 0,
  },
  maxDistance: {
    type: Number, required: true, min: 1, max: 100, default: 25,
  },
  distanceDealbreaker: {
    type: Number, required: true, min: 0, max: 1, default: 0,
  },
  minAgeRange: {
    type: Number, required: true, min: 18, max: 100, default: 18,
  },
  maxAgeRange: {
    type: Number, required: true, min: 18, max: 100, default: 40,
  },
  ageDealbreaker: {
    type: Number, required: true, min: 0, max: 1, default: 0,
  },
  minHeightRange: {
    type: Number, required: true, min: 40, max: 100, default: 40,
  },
  maxHeightRange: {
    type: Number, required: true, min: 40, max: 100, default: 100,
  },
  heightDealbreaker: {
    type: Number, required: true, min: 0, max: 1, default: 0,
  },
}, { timestamps: true });
