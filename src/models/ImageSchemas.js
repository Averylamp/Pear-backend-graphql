
const mongoose = require('mongoose');

const { Schema } = mongoose;

const createImageInput = `
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
  imageType: ImageType!
}
`;

const imageContainerType = `
type ImageContainer{
  # The generated ID of the image
  imageID: String!
  original: Image!
  large:    Image!
  medium:   Image!
  small:    Image!
  thumbnail:    Image!

  # The user ID of the user that originally uploaded the image
  uploadedByUser_id: ID!
  uploadedByUser: User
}

type Image{
  imageURL: String!
  width: Int!
  height: Int!
  imageType: ImageType!
}
`;

const imageTypeEnum = `
enum ImageType{
  original
  large
  medium
  small
  thumbnail
}
`;

export const typeDef = imageContainerType
+ imageTypeEnum
+ createImageInput;

export const ImageSchema = new Schema({
  imageURL: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  imageType: { type: String, required: true, enum: ['original', 'large', 'medium', 'small', 'thumbnail'] },
});

export const ImageContainerSchema = new Schema({
  imageID: { type: String, required: true },
  original: { type: ImageSchema, required: true },
  large: { type: ImageSchema, required: true },
  medium: { type: ImageSchema, required: true },
  small: { type: ImageSchema, required: true },
  thumbnail: { type: ImageSchema, required: true },
  uploadedByUser_id: {
    type: Schema.Types.ObjectId, required: true, index: true, unique: false,
  },
}, { timestamps: true });
