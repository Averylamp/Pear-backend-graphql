const mongoose = require('mongoose');

const { Schema } = mongoose;

export const PointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
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
