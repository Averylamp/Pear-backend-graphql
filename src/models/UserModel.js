import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { GeoJSONSchema } from './TypeSchemas';
import { ImageContainerSchema } from './ImageSchemas';

const mongoose = require('mongoose');

const { Schema } = mongoose;


const queryRoutes = `
extend type Query {
  # Get a user by an ID
  user(id: ID): User
  # Get a user by firebase tokens
  getUser(userInput: GetUserInput): UserMutationResponse!
}

`;

const mutationRoutes = `
extend type Mutation{
  # Creates a new User Object
  createUser(userInput: CreationUserInput): UserMutationResponse!

  # Updates an existing User
  updateUser(id: ID, updateUserInput: UpdateUserInput) : UserMutationResponse!

  # Updates a User's photos or photo bank
  updateUserPhotos(updateUserPhotosInput: UpdateUserPhotosInput): UserMutationResponse!
}
`;

const getUserInputs = `
input GetUserInput{
  # The Firebase generated token
  firebaseToken: String!

  #The UID of the Fireabse user
  firebaseAuthID: String!
}
`;

const createUserInputs = `
input CreationUserInput{
  _id: ID
  # User's Age
  age: Int!
  # User's birthday
  birthdate: String!
  # User's email
  email: String!
  emailVerified: Boolean!
  # User's phone number
  phoneNumber: String!
  phoneNumberVerified: Boolean!
  firstName: String!
  lastName: String!
  gender: Gender!

  # The Firebase generated token
  firebaseToken: String!

  # The Firebase generated token
  firebaseAuthID: String!

  # Option ID of the Facebook User
  facebookId: String
  # Option Facebook Graph API Access token
  facebookAccessToken: String

  # Option url for profile thumbnail
  thumbnailURL: String
}
`;

const updateUserInputs = `
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

`;

const updateUserPhotosInput = `
input UpdateUserPhotosInput {
  user_id: ID!
  displayedImages: [CreateImageContainer!]!
  additionalImages: [CreateImageContainer!]!
}

`;

const userType = `
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
  gender: Gender
  age: Int!
  birthdate: String!
  locationName: String
  locationCoordinates: String
  school: String
  schoolEmail: String
  schoolEmailVerified: Boolean

  # The ordered images that currently make up the User's Profile
  displayedImages: [ImageContainer!]!
  # All images uploaded for a user
  bankImages: [ImageContainer!]!

  pearPoints: Int

  # All Attached Profile IDs for a user
  profile_ids: [ID!]!
  # All Attached Profiles for a user
  profileObjs: [UserProfile!]!

  # All Created and Attached Profile IDs for a user
  endorsedProfile_ids: [ID!]!
  # All Created and Attached Profiles for a user
  endorsedProfileObjs: [UserProfile!]!

  # All Detached Profile IDs for a user
  detachedProfile_ids: [ID!]!
  # All Detached Profiles for a user
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
`;

const mutationResponse = `
type UserMutationResponse{
  success: Boolean!
  message: String
  user: User
}
`;

const genderEnum = `
enum Gender{
  male
  female
  nonbinary
}
`;
export const typeDef = queryRoutes
+ mutationRoutes
+ getUserInputs
+ createUserInputs
+ updateUserInputs
+ updateUserPhotosInput
+ userType
+ mutationResponse
+ genderEnum;

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
