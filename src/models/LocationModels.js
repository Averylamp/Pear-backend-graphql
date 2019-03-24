const mongoose = require('mongoose');

const { Schema } = mongoose;

const locationType = `
type Location {
  # [longitude, latitude]
  coords: [Float!]!
  coordsLastUpdated: String!
  locationName: String
  locationNameLastUpdated: String
}
`;

export const typeDef = locationType;

export const PointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [<longitude>, <latitude>]
    required: true,
  },
}, { timestamps: true });

export const LocationNameSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export const LocationSchema = new Schema({
  // TODO: i'm not sure if this indexing actually does anything?? removing it seems to be fine...
  point: { type: PointSchema, required: true, index: '2dsphere' },
  locationName: { type: LocationNameSchema, required: false },
}, { timestamps: true });
