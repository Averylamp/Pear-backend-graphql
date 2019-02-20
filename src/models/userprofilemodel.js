var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `
type UserProfile{
  _id: ID!
  creator_id: ID!
  creator_obj: User!
  user_id: ID!
  user_obj: User!
  activeProfile: Boolean!
  activeDiscovery: Boolean!
  fullName: String!
  firstName: String!
  lastName: String!
  gender: Gender!
  age: Int!
  height: Int
  locationName: String
  locationCoordinates: String
  school: String

  profileImageIDs: [String!]!
  profileImages: ImageSizes!
  discovery_id: ID!
  discovery_obj: Discovery!
  userProfileData: UserProfileData!
}

type UserProfileData{
  totalProfileViews: Int!
  totalProfileLikes: Int!
}

type ImageSizes{
  original: [ImageMetadata!]!
  large:    [ImageMetadata!]!
  medium:   [ImageMetadata!]!
  small:    [ImageMetadata!]!
  thumb:    [ImageMetadata!]!
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

enum Gender{
  male
  female
  nonbinary
}
`

export const resolvers = {
  Query: {

  },
  UserProfile: {

  }
}

var UserProfileSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  creator_id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },

  activeProfile: { type: Boolean, required: true},
  activeDiscovery: { type: Boolean, required: true},
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  demographics:  {
    gender: { type: String, required: true, enum: ["male", "female", "nonbinary"], index: true },
    age: { type: Number, required: true, min: 18, max: 80, index: true },
    height: { type: Number, required: false, min: 20, max: 100, index: true },
    locationName: { type: String, required: false },
    locationCoordinates: { type: String, required: false },
    school: { type: String, required: false },
    ethnicities: { type: [String], required: false },
    religion: { type: [String], required: false },
    political: { type: [String], required: false },
    smoking: { type: [String], required: false },
    drinking: { type: [String], required: false },
  },

  userProfileData: {
    totalProfileViews: { type: Number, required: true, min: 0, default: 0 },
    totalProfileLikes: { type: Number, required: true, min: 0, default: 0 },
  },

  profileImageIDs: { type: [String], required: true },
  profileImages: {
    original: { type: [ Schema.Types.Mixed], required: true },
    large: { type: [ Schema.Types.Mixed], required: true },
    medium: { type: [ Schema.Types.Mixed], required: true },
    small: { type: [ Schema.Types.Mixed], required: true },
    thumb: { type: [ Schema.Types.Mixed], required: true },
  },

  discovery_id: { type: Schema.Types.ObjectId, required: true },
  
})


// creator_obj: User!
// user_obj: User!
// discovery_obj: Discovery!

export const UserProfile = mongoose.model("UserProfile", UserProfileSchema)
