import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { ImageContainerSchema } from './ImageSchemas';
import { EdgeSummarySchema } from './MatchModel';
import { EndorsementEdgeSchema } from './UserProfileModel';
import { USERS_ALREADY_MATCHED_ERROR } from '../resolvers/ResolverErrorStrings';

const mongoose = require('mongoose');

const { Schema } = mongoose;


const queryRoutes = `
extend type Query {
  # Get a user by an ID
  user(id: ID): User
  # Get a user by firebase tokens
  getUser(userInput: GetUserInput): UserMutationResponse!
  # send a push notification indicating new message
  notifyNewMessage(fromUser_id: ID!, toUser_id: ID!): Boolean!
  # get fake user count
  getUserCount: Int!
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

  # [longitude, latitude]
  location: [Float!]!
  locationName: String

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

  # Optional firebase remote instance ID for push notifications
  firebaseRemoteInstanceID: String

  # referral codes, for tracking
  referredByCode: String
  
  # seeded?
  seeded: Boolean
}
`;

const updateUserInputs = `
input UpdateUserInput {
  age: Int
  birthdate: String
  email: String
  emailVerified: Boolean
  phoneNumber: String
  phoneNumberVerified: Boolean
  firstName: String
  lastName: String
  gender: Gender
  school: String
  schoolYear: String
  isSeeking: Boolean
  deactivated: Boolean

  seekingGender: [Gender!]
  maxDistance: Int
  minAgeRange: Int
  maxAgeRange: Int

  # [longitude, latitude]
  location: [Float!]
  locationName: String

  # Option url for profile thumbnail
  thumbnailURL: String

  # Optional firebase remote instance ID for push notifications
  firebaseRemoteInstanceID: String
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
  gender: Gender!
  age: Int!
  birthdate: String!

  school: String
  schoolYear: String
  schoolEmail: String
  schoolEmailVerified: Boolean
  isSeeking: Boolean!

  # The ordered images that currently make up the User's Profile
  displayedImages: [ImageContainer!]!
  # All images uploaded for a user
  bankImages: [ImageContainer!]!

  pearPoints: Int!

  # All Attached Profile IDs for a user
  profile_ids: [ID!]!
  # All Attached Profiles for a user
  profileObjs: [UserProfile!]!
  # Number of profiles associated with the user
  profileCount: Int!

  # All Created and Attached Profile IDs for a user
  endorsedProfile_ids: [ID!]!
  # All Created and Attached Profiles for a user
  endorsedProfileObjs: [UserProfile!]!

  # All Detached Profile IDs for a user
  detachedProfile_ids: [ID!]!
  # All Detached Profiles for a user
  detachedProfileObjs: [DetachedProfile!]!

  # metainfo about matchmaker chats
  endorsementEdges: [EndorsementEdge!]!

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

  # FOR TESTING ONLY:
  # edgeSummaries: [EdgeSummary!]!

  # referral codes
  referredByCode: String
  referralCode: String
  
  # seeded profile? null is false
  seeded: Boolean
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
  firebaseToken: { type: String, required: true },
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
  school: { type: String, required: false },
  schoolYear: { type: String, required: false },
  schoolEmail: { type: String, required: false },
  schoolEmailVerified: { type: Boolean, required: false, default: false },
  isSeeking: { type: Boolean, required: true, default: false },

  pearPoints: { type: Number, required: true, default: 0 },

  displayedImages: { type: [ImageContainerSchema], required: true, default: [] },
  bankImages: { type: [ImageContainerSchema], required: true, default: [] },

  profile_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  profileCount: {
    type: Number, required: true, index: true, default: 0,
  },
  endorsedProfile_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  detachedProfile_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },

  endorsementEdges: {
    type: [EndorsementEdgeSchema], required: true, default: [],
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

  firebaseRemoteInstanceID: { type: String, required: false },

  referredByCode: {
    type: String, required: false, index: true, sparse: true,
  },
  referralCode: {
    type: String, required: false, unique: true, index: true, sparse: true,
  },

  seeded: {
    type: Boolean, required: false, default: false,
  },
}, { timestamps: true });

UserSchema.virtual('fullName')
  .get(function fullName() {
    return `${this.firstName} ${this.lastName}`;
  });

export const User = mongoose.model('User', UserSchema);

// TODO: replace all of this with `return (new User(userinput)).save()` and handle error
export const createUserObject = (userInput) => {
  const userModel = new User(userInput);
  return userModel.save();
};

export const receiveRequest = (me, otherUser, match_id) => {
  const alreadyExists = me.edgeSummaries.find(
    edgeSummary => (edgeSummary.otherUser_id.toString() === otherUser._id.toString()),
  );
  if (alreadyExists !== undefined) {
    return Promise.reject(
      new Error(USERS_ALREADY_MATCHED_ERROR),
    );
  }
  me.edgeSummaries.push({
    otherUser_id: otherUser._id,
    match_id,
  });
  me.requestedMatch_ids.push(match_id);
  return me.save();
};

export const sendRequest = (me, otherUser, match_id) => {
  const alreadyExists = me.edgeSummaries.find(
    edgeSummary => (edgeSummary.otherUser_id.toString() === otherUser._id.toString()),
  );
  if (alreadyExists !== undefined) {
    return Promise.reject(
      new Error(USERS_ALREADY_MATCHED_ERROR),
    );
  }
  me.edgeSummaries.push({
    otherUser_id: otherUser._id,
    match_id,
  });
  return me.save();
};
