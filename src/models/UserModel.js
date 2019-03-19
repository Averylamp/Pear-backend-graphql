import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { GeoJSONSchema } from './TypeSchemas';
import { ImageContainerSchema } from './ImageSchemas';
import { EdgeSummarySchema } from './MatchModel';

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
  isSeeking: Boolean!

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

  discoveryQueue_id: ID!
  discoveryQueueObj: DiscoveryQueue!

  matchingPreferences: MatchingPreferences!
  matchingDemographics: MatchingDemographics!
  
  blockedUser_ids: [ID!]!
  blockedUsers: [User]!
  
  # Open match requests which this user has not yet made a decision on
  requestedMatch_ids: [ID!]!
  requestedMatches: [Match!]!
  
  # Matches this user is a part of which both parties have accepted
  currentMatch_ids: [ID!]!
  currentMatches: [Match!]!
  
  # All users this user has ever been part of a match with (whether request, accepted, unmatched)
  # This field is not stored in MongoDB. Rather, the resolver pulls this information from
  # the EdgeSummaries field.
  edgeUser_ids: [ID!]!
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
  isSeeking: { type: Boolean, required: true, default: false },

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

  discoveryQueue_id: { type: Schema.Types.ObjectId, required: true },

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

  blockedUser_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  requestedMatch_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  currentMatch_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  edgeSummaries: { type: [EdgeSummarySchema], required: true, default: [] },
}, { timestamps: true });

UserSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});


// profileObjs: { type: [, required: true,  UserProfile!]!
// endorsedProfileObjs: { type: [, required: true,  UserProfile!]!
export const User = mongoose.model('User', UserSchema);

// TODO: replace all of this with `return (new User(userinput)).save()` and handle error
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

export const addNewEdge = (me, otherUser, match_id) => {
  me.edgeSummaries.push({
    otherUser_id: otherUser._id,
    match_id,
  });
  return me.save();
};
