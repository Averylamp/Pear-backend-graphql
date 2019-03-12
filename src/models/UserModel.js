import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { GeoJSONSchema } from './TypeSchemas';
import { ImageContainerSchema } from './ImageSchemas';

const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `
extend type Query {
  user(id: ID): User
  getUser(userInput: GetUserInput): UserMutationResponse!
}

extend type Mutation{
  createUser(userInput: CreationUserInput): UserMutationResponse!
  updateUser(id: ID, updateUserInput: UpdateUserInput) : UserMutationResponse!
  approveNewDetachedProfile(user_id: ID!, detachedProfile_id: ID!, creator_id: ID!): UserMutationResponse!
  updatePhotos(updateUserPhotosInput: UpdateUserPhotosInput): UserMutationResponse!
}

input GetUserInput{
  firebaseToken: String!
  firebaseAuthID: String!
}

input CreationUserInput{
  _id: ID
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

input UpdateUserPhotosInput {
  user_id: ID!
  displayedImages: [CreateImageContainer!]!
  additionalImages: [CreateImageContainer!]!
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
  
  displayedImages: [ImageContainer!]!
  bankImages: [ImageContainer!]!

  pearPoints: Int

  profile_ids: [ID!]!
  profileObjs: [UserProfile!]!
  endorsedProfile_ids: [ID!]!
  endorsedProfileObjs: [UserProfile!]!
  detachedProfile_ids: [ID!]!
  detachedProfileObjs: [DetachedProfile!]!

  userMatches_id: ID!
  userMatchesObj: UserMatches!
  discoveryQueue_id: ID!
  discoveryQueueObj: DiscoveryQueue!

  userStats: UserStats!

  matchingPreferences: MatchingPreferences!
  matchingDemographics: MatchingDemographics!
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

enum Gender{
  male
  female
  nonbinary
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
  facebookId: {
    type: String, required: false, unique: true, index: true, sparse: true,
  },
  facebookAccessToken: {
    type: String, required: false, unique: true, index: true, sparse: true,
  },
  email: { type: String, required: false },
  emailVerified: { type: Boolean, required: true, default: false },
  phoneNumber: {
    type: String,
    required: true,
    validate: { validator(v) { return /\d{10}$/.test(v) && v.length === 10; } },
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

  displayedImages: { type: [ImageContainerSchema], required: true, default: [] },
  bankImages: { type: [ImageContainerSchema], required: true, default: [] },

  profile_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  endorsedProfile_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  detachedProfile_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },

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
createUserObject(userInput) {
  const userModel = new User(userInput);


  return new Promise((resolve, reject) => {
    userModel.save((err) => {
      if (err) {
        reject(err);
      }
      resolve(userModel);
    });
  });
};
