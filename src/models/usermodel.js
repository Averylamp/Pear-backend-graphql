var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `
type User {
  _id: ID!
  firebaseToken: String!
  facebookId: String
  facebookAccessToken: String
  email: String!
  phoneNumber: String!
  fullName: String!
  firstName: String!
  lastName: String!
  userPreferences: UserPreferences!
  thumbnailURL: String
  gender: Gender
  locationName: String
  locationCoordinates: String
  school: String
  age: Int
  ethnicities: [String!]
  profile_ids: [ID!]!
  profile_objs: [UserProfile!]!
  endorsedProfile_ids: [ID!]!
  endorsedProfile_objs: [UserProfile!]!
  userStatData: UserStatData
  userMatches: UserMatches!
}


type UserStatData{
  toatlNumberOfMatchRequests: Int!
  totalNumberOfMatches: Int!
  totalNumberOfProfilesCreated: Int!
  totalNumberOfEndorsementsCreated: Int!
  conversationTotalNumber: Int!
  conversationTotalNumberFirstMessage: Int!
  conversationTotalNumberTenMessages: Int!
  conversationTotalNumberHundredMessages: Int!
}

type UserPreferences{
  ethnicities: [String!]!
  seekingGender: [Gender!]!
  seekingReason: [String!]!
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
`

export const resolvers = {
  Query: {

  },
  User: {

  }
}

var UserSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  deactivated : { type: Boolean, required: true, default: false},
  firebaseToken: { type: String, required: false },
  firebaseAuthID: { type: String, required: false },
  facebookId: { type: String, required: false },
  facebookAccessToken: { type: String, required: false },
  email: { type: String, required: false },
  phoneNumber: { type: String, required: true, match: "+1^\d{10}$", index: true },
  phoneNumberVerified: { type: Boolean, required: true, default: false},
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  thumbnailURL: { type: String, required: false },
  gender: { type: String, required: false, enum: ["male", "female", "nonbinary"] },
  locationName: { type: String, required: false },
  locationCoordinates: { type: String, required: false },
  school: { type: String, required: false },
  schoolEmail: { type: String, required: false },
  schoolEmailVerified: { type: Boolean, required: false, default: false },
  birthdate: { type: Date, required: false },
  age: { type: Number, required: false, min: 18, max: 100, index: true },
  profile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  endorsedProfile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  userMatches_id: { type: Schema.Types.ObjectId, required: true },

  pearPoints: { type: Number, required: true, default: 0 },

  userStatData: {
    totalNumberOfMatchRequests: { type: Number, required: true, default: 0 },
    totalNumberOfMatches: { type: Number, required: true, default: 0 },
    totalNumberOfProfilesCreated: { type: Number, required: true, default: 0 },
    totalNumberOfEndorsementsCreated: { type: Number, required: true, default: 0 },
    conversationTotalNumber: { type: Number, required: true, default: 0 },
    conversationTotalNumberFirstMessage: { type: Number, required: true, default: 0 },
    conversationTotalNumberTenMessages: { type: Number, required: true, default: 0 },
    conversationTotalNumberTwentyMessages: { type: Number, required: true, default: 0 },
    conversationTotalNumberHundredMessages: { type: Number, required: true, default: 0 },
  },

  userDemographics:  {
    ethnicities: { type: [String], required: false },
    religion: { type: [String], required: false },
    political: { type: [String], required: false },
    smoking: { type: [String], required: false },
    drinking: { type: [String], required: false },
    height: { type: Number, required: false },
  },

  userPreferences: {
    ethnicities: { type: [String], required: true },
    seekingGender: { type: [String], required: true },
    seekingReason: { type: [String], required: true },
    reasonDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0 },
    seekingEthnicity: { type: [String], required: true },
    ethnicityDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
    maxDistance: { type: Number, required: true, min: 1, max: 100, default: 25 },
    distanceDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
    minAgeRange: { type: Number, required: true, min: 18, max: 100, default: 18 },
    maxAgeRange: { type: Number, required: true, min: 18, max: 100, default: 40 },
    ageDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
    minHeightRange: { type: Number, required: true, min: 40, max: 100, default: 40 },
    maxHeightRange: { type: Number, required: true, min: 40, max: 100, default: 100 },
    heightDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
  },

})

// profile_objs: { type: [, required: true,  UserProfile!]!
// endorsedProfile_objs: { type: [, required: true,  UserProfile!]!
export const User = mongoose.model("User", UserSchema)
