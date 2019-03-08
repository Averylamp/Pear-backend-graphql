
const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `

input CreateImageSizes {
  original: [CreateImageMetadata!]!
  large:    [CreateImageMetadata!]!
  medium:   [CreateImageMetadata!]!
  small:    [CreateImageMetadata!]!
  thumbnail:    [CreateImageMetadata!]!
}

input CreateImageMetadata{
  imageURL: String!
  imageID: String!
  imageSize: CreateImageSize!
}

input CreateImageSize{
  width: Int!
  height: Int!
}

type ImageSizes{
  original: [ImageMetadata!]!
  large:    [ImageMetadata!]!
  medium:   [ImageMetadata!]!
  small:    [ImageMetadata!]!
  thumbnail:    [ImageMetadata!]!
}

type ImageMetadata{
  imageURL: String!
  imageID: String!
  imageSize: ImageSize!
}

type ImageSize{
  width: Int!
  height: Int!
}


`;

export const ImageMetadataSchema = new Schema({
  imageURL: { type: String, required: true },
  imageID: { type: String, required: true },
  imageSize: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
});

export const ImageSizes = new Schema({
  original: { type: [ImageMetadataSchema], required: true, default: [] },
  large: { type: [ImageMetadataSchema], required: true, default: [] },
  medium: { type: [ImageMetadataSchema], required: true, default: [] },
  small: { type: [ImageMetadataSchema], required: true, default: [] },
  thumb: { type: [ImageMetadataSchema], required: true, default: [] },
});
