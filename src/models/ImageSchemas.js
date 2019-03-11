
const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `

input CreateImageContainer {
  imageID: String!
  original: CreateImage!
  large:    CreateImage!
  medium:   CreateImage!
  small:    CreateImage!
  thumbnail:    CreateImage!
  uploadedByUser_id: ID!
}

input CreateImage{
  imageURL: String!
  width: Int!
  height: Int!
}

type ImageContainer{
  imageID: String!
  original: Image!
  large:    Image!
  medium:   Image!
  small:    Image!
  thumbnail:    Image!
  uploadedByUser_id: ID!
  uploadedByUser: User
}

type Image{
  imageURL: String!
  width: Int!
  height: Int!
}


`;

export const ImageSchema = new Schema({
  imageURL: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
});

export const ImageContainerSchema = new Schema({
  imageID: { type: String, required: true },
  original: { type: ImageSchema, required: true },
  large: { type: ImageSchema, required: true },
  medium: { type: ImageSchema, required: true },
  small: { type: ImageSchema, required: true },
  thumbnail: { type: ImageSchema, required: true },
  uploadedBy_id: {
    type: Schema.Types.ObjectId, required: true, index: true, unique: false,
  },
});
