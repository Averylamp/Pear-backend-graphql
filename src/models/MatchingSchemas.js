import { LocationSchema } from './LocationModels';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const matchingDemographicsType = `
type MatchingDemographics{
  gender: Gender!
  age: Int!
  location: Location!
}
`;

const matchingPreferencesType = `
type MatchingPreferences{
  seekingGender: [Gender!]!
  maxDistance: Int!
  minAgeRange: Int!
  maxAgeRange: Int!
  location: Location!
}
`;

export const typeDef = matchingDemographicsType + matchingPreferencesType;

export const MatchingDemographicsSchema = new Schema({
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'nonbinary'],
    default: 'male',
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
    default: 20,
  },
  location: {
    type: LocationSchema,
    required: true,
    default: {
      point: {
        type: 'Point',
        coordinates: [-71.093609, 42.358620],
      },
    },
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
    default: 40,
  },
  location: {
    type: LocationSchema,
    required: true,
    default: {
      point: {
        type: 'Point',
        coordinates: [-71.093609, 42.358620],
      },
    },
  },
}, { timestamps: true });
