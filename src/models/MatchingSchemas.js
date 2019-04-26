import { LocationSchema } from './LocationModels';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const matchingDemographicsType = `
type MatchingDemographics{
  gender: Gender
  age: Int
  location: Location
}
`;

const matchingPreferencesType = `
type MatchingPreferences{
  seekingGender: [Gender!]!
  maxDistance: Int!
  minAgeRange: Int!
  maxAgeRange: Int!
  location: Location
}
`;

export const typeDef = matchingDemographicsType + matchingPreferencesType;

export const MatchingDemographicsSchema = new Schema({
  gender: {
    type: String,
    required: false,
    enum: ['male', 'female', 'nonbinary'],
  },
  age: {
    type: Number,
    required: false,
    min: 18,
    max: 100,
    default: 20,
  },
  location: {
    type: LocationSchema,
    required: false,
  },
}, { timestamps: true });


export const MatchingPreferencesSchema = new Schema({
  seekingGender: {
    type: [String],
    required: true,
    enum: ['male', 'female', 'nonbinary'],
    default: ['male', 'female', 'nonbinary'],
  },
  maxDistance: {
    // in miles
    type: Number,
    required: true,
    min: 5,
    max: 200,
    default: 25,
  },
  minAgeRange: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
    default: 18,
  },
  maxAgeRange: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
    default: 27,
  },
  location: {
    type: LocationSchema,
    required: false,
  },
}, { timestamps: true });
