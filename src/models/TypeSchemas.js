const mongoose = require('mongoose');

const { Schema } = mongoose;

export const GeoJSONSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});
