import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { GeoJSONSchema } from './TypeSchemas';

const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `
extend type Query {
  user(id: ID): User
}

extend type Mutation{
  createUser(userInput: CreationUserInput): UserMutationResponse
  getUser(userInput: GetUserInput): UserMutationResponse
  updateUser(id: ID, updateUserInput: UpdateUserInput) : UserMutationResponse
}

input GetUserInput{
  firebaseToken: String!
  firebaseAuthID: String!
}

input CreationUserInput{
  age: Int!
  birthdate: String!
  email: String!
  emailVerified: Boolean!
  phoneNumber: String!
  phoneNumberVerified: Boolean!
  firstName: String!
  lastName: String!
  gender: Gender!
  firebaseToken: String!
  firebaseAuthID: String!
  facebookId: String
  facebookAccessToken: String

  thumbnailURL: String
}

input UserPreferencesInitialInput {
  seekingGender: [String!]!
}

input UserPreferencesInput{
  ethnicities: [String!]
  seekingGender: [Gender!]
  seekingReason: [String!]
  reasonDealbreaker: Int
  seekingEthnicity: [String!]
  ethnicityDealbreaker: Int
  maxDistance: Int
  distanceDealbreaker: Int
  minAgeRange: Int
  maxAgeRange: Int
  ageDealbreaker: Int
  minHeightRange: Int
  maxHeightRange: Int
  heightDealbreaker: Int
}

input UserDemographicsInput{
  ethnicities: [String!]
  religion: [String!]
  political: [String!]
  smoking: [String!]
  drinking: [String!]
  height: Int
}

input UserStatsInput{
  totalNumberOfMatchRequests: Int
  totalNumberOfMatches: Int
  totalNumberOfProfilesCreated: Int
  totalNumberOfEndorsementsCreated: Int
  conversationTotalNumber: Int
  conversationTotalNumberFirstMessage: Int
  conversationTotalNumberTenMessages: Int
  conversationTotalNumberHundredMessages: Int
}

input UpdateUserInput {
  deactivated: Boolean
  firebaseToken: String
  firebaseAuthID: String
  facebookId: String
  facebookAccessToken: String
  email: String
  phoneNumber: String
  phoneNumberVerified: Boolean
  firstName: String
  lastName: String
  thumbnailURL: String
  gender: Gender
  locationName: String
  locationCoordinates: String
  school: String
  schoolEmail: String
  schoolEmailVerified: Boolean
  birthdate: String
  age: Int
  userPreferences: UserPreferencesInput
  userStats: UserStatsInput
  userDemographics: UserDemographicsInput
  pearPoints: Int
}

type User {
  _id: ID!
  deactivated: Boolean!
  firebaseToken: String!
  firebaseAuthID: String!
  facebookId: String
  facebookAccessToken: String
  email: String!
  emailVerified: Boolean!
  phoneNumber: String!
  phoneNumberVerified: Boolean!
  firstName: String!
  lastName: String!
  fullName: String!
  thumbnailURL: String
  gender: String
  age: Int!
  birthdate: String!
  locationName: String
  locationCoordinates: String
  school: String
  schoolEmail: String
  schoolEmailVerified: Boolean

  pearPoints: Int

  profile_ids: [ID!]!
  profileObjs: [UserProfile!]!
  endorsedProfile_ids: [ID!]!
  endorsedProfileObjs: [UserProfile!]!

  userMatches_id: ID!
  userMatchesObj: UserMatches!
  discoveryQueue_id: ID!
  discoveryQueueObj: DiscoveryQueue!

  userStats: UserStats!

  matchingPreferences: MatchingPreferences!
  matchingDemographics: MatchingDemographics!
}

type MatchingDemographics{
  gender: Gender!
  age: Int!
  birthdate: String!
  height: Int
  religion: [String!]
  ethnicities: [String!]
  political: [String!]
  smoking: [String!]
  drinking: [String!]
  school: String
}

type MatchingPreferences{
  ethnicities: [String!]
  seekingGender: [Gender!]!
  seekingReason: [String!]
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

type UserStats{
  totalNumberOfMatchRequests: Int!
  totalNumberOfMatches: Int!
  totalNumberOfProfilesCreated: Int!
  totalNumberOfEndorsementsCreated: Int!
  conversationTotalNumber: Int!
  conversationTotalNumberFirstMessage: Int!
  conversationTotalNumberTenMessages: Int!
  conversationTotalNumberHundredMessages: Int!
}

type UserMutationResponse{
  success: Boolean!
  message: String
  user: User
}



`;

const UserStatsSchema = new Schema({
  totalNumberOfMatchRequests: { type: Number, required: true, default: 0 },
  totalNumberOfMatches: { type: Number, required: true, default: 0 },
  totalNumberOfProfilesCreated: { type: Number, required: true, default: 0 },
  totalNumberOfEndorsementsCreated: { type: Number, required: true, default: 0 },
  conversationTotalNumber: { type: Number, required: true, default: 0 },
  conversationTotalNumberFirstMessage: { type: Number, required: true, default: 0 },
  conversationTotalNumberTenMessages: { type: Number, required: true, default: 0 },
  conversationTotalNumberTwentyMessages: { type: Number, required: true, default: 0 },
  conversationTotalNumberHundredMessages: { type: Number, required: true, default: 0 },
});

const UserSchema = new Schema({
  deactivated: { type: Boolean, required: true, default: false },
  firebaseToken: {
    type: String, required: true,
  },
  firebaseAuthID: {
    type: String, required: true, index: true, unique: true,
  },
  facebookId: { type: String, required: false, unique: true },
  facebookAccessToken: { type: String, required: false, unique: true },
  email: { type: String, required: false },
  emailVerified: { type: Boolean, required: true, default: false },
  phoneNumber: {
    type: String,
    required: true,
    validate: { validator(v) { return /\d{10}$/.test(v); } },
    index: true,
  },
  phoneNumberVerified: { type: Boolean, required: true, default: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  thumbnailURL: { type: String, required: false },
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary'] },
  age: {
    type: Number, required: true, min: 18, max: 100, index: true,
  },
  birthdate: { type: Date, required: true },
  locationName: { type: String, required: false },
  locationCoordinates: { type: GeoJSONSchema, required: false },
  school: { type: String, required: false },
  schoolEmail: { type: String, required: false },
  schoolEmailVerified: { type: Boolean, required: false, default: false },

  pearPoints: { type: Number, required: true, default: 0 },

  profile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  endorsedProfile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },

  userMatches_id: { type: Schema.Types.ObjectId, required: true },
  discoveryQueue_id: { type: Schema.Types.ObjectId, required: true },

  userStats: { type: UserStatsSchema, required: true, default: UserStatsSchema },

  matchingDemographics: {
    type: MatchingDemographicsSchema,
    required: true,
    default: MatchingDemographicsSchema,
  },
  matchingPreferences: {
    type: MatchingPreferencesSchema,
    required: true,
    default: MatchingPreferencesSchema,
  },

}, { timestamps: true });

UserSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});


// profileObjs: { type: [, required: true,  UserProfile!]!
// endorsedProfileObjs: { type: [, required: true,  UserProfile!]!
export const User = mongoose.model('User', UserSchema);

export const createUserObject = function
createUserObject(userInput, _id = mongoose.Types.ObjectId()) {
  const userModel = new User(userInput);

  userModel._id = _id;

  return new Promise((resolve, reject) => {
    userModel.save((err) => {
      if (err) {
        reject(err);
      }
      resolve(userModel);
    });
  });
};