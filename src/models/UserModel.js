import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { ImageContainerSchema } from './ImageSchemas';
import { EdgeSummarySchema } from './MatchModel';

const mongoose = require('mongoose');
const debug = require('debug')('dev:UserModel');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # Get a user by an ID
  user(id: ID!): User
  # Get a user by firebase tokens
  getUser(userInput: GetUserInput!): UserMutationResponse!
  # send a push notification indicating new message
  notifyNewMessage(fromUser_id: ID!, toUser_id: ID!): Boolean!
  # return a sub-array of a list of phone numbers, representing users who are already on pear
  alreadyOnPlatform(myPhoneNumber: String!, phoneNumbers: [String!]!): [String!]!
  # get fake user count
  getUserCount: Int!
  
  # admin
  getAllUsers: [User!]!
}

`;

const mutationRoutes = `
extend type Mutation{
  # Creates a new User Object
  createUser(userInput: CreationUserInput!): UserMutationResponse!

  # Updates an existing User
  updateUser(updateUserInput: UpdateUserInput!): UserMutationResponse!

  # Updates a User's photos or photo bank
  updateUserPhotos(updateUserPhotosInput: UpdateUserPhotosInput!): UserMutationResponse!

  # DEVMODE ONLY: delete a user object. when called from prod, this is no-op
  deleteUser(user_id: ID!): UserDeletionResponse!
  
  # mark a profile as high quality
  markHighQuality(user_id: ID!): UserMutationResponse!
  
  # mark a profile as low quality
  markLowQuality(user_id: ID!): UserMutationResponse!
  
  # mark a profile as regular quality
  markRegularQuality(user_id: ID!): UserMutationResponse!
}
`;

const getUserInputs = `
input GetUserInput{
  # The Firebase generated token
  firebaseToken: String!

  # The UID of the Firebase user
  firebaseAuthID: String!
}
`;

const createUserInputs = `
input CreationUserInput{
  # for testing only
  _id: ID
  # User's phone number
  phoneNumber: String!
  phoneNumberVerified: Boolean!

  # The Firebase auth ID
  firebaseAuthID: String!

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
  user_id: ID!

  deactivated: Boolean
  email: String
  emailVerified: Boolean
  phoneNumber: String
  phoneNumberVerified: Boolean
  notificationsEnabled: Boolean
  firstName: String
  lastName: String
  thumbnailURL: String
  gender: Gender
  age: Int
  birthdate: String
  
  school: String
  schoolYear: String
  schoolEmail: String
  schoolEmailVerified: Boolean
  work: String
  jobTitle: String
  hometown: String
  isSeeking: Boolean

  seekingGender: [Gender!]
  maxDistance: Int
  minAgeRange: Int
  maxAgeRange: Int

  # [longitude, latitude]
  location: [Float!]
  locationName: String

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
  firebaseAuthID: String!
  facebookId: String
  facebookAccessToken: String
  email: String
  emailVerified: Boolean
  phoneNumber: String!
  phoneNumberVerified: Boolean!
  firstName: String
  lastName: String
  fullName: String
  thumbnailURL: String
  gender: Gender
  age: Int
  birthdate: String

  # profile content. ordered
  bio:  String

  school: String
  schoolYear: String
  schoolEmail: String
  schoolEmailVerified: Boolean
  work: String
  jobTitle: String
  hometown: String
  isSeeking: Boolean!

  # The ordered images that currently make up the User's Profile
  displayedImages: [ImageContainer!]!
  displayedImagesCount: Int!
  # All images uploaded for a user
  bankImages: [ImageContainer!]!

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

  # referral codes
  referredByCode: String
  referralCode: String
  

  # seeded / lowQuality profile?
  seeded: Boolean!
  lowQuality: Boolean!
  
  lastActiveTimes: [String!]!
  lastEditedTimes: [String!]!
  lastActive: String!
  createdAt: String!

  hostingEventIDs:[ID!]!
  hostingEvents:[Event!]!

}

`;

const mutationResponse = `
type UserMutationResponse{
  success: Boolean!
  message: String
  user: User
}

type UserDeletionResponse {
  success: Boolean!
  message: String
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
  firebaseAuthID: {
    type: String, required: true, index: true, unique: true,
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
  notificationsEnabled: { type: Boolean, required: true, default: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  thumbnailURL: { type: String, required: false },
  gender: { type: String, required: false, enum: ['male', 'female', 'nonbinary'] },
  age: {
    type: Number, required: false, min: 18, max: 100, index: true, sparse: true,
  },
  birthdate: { type: Date, required: false },

  bio: { type: String, required: true, default: '' },

  personalMatchesSentCount: { // total number of personal match requests sent
    type: Number, required: true, index: true, default: 0,
  },
  matchRequestsReceivedCount: { // total number of matches they're receivedByUser
    type: Number, required: true, index: true, default: 0,
  },
  matchRequestsRejectedCount: { // personal requests received they've rejected
    type: Number, required: true, index: true, default: 0,
  },
  matchRequestsAcceptedCount: { // personal requests received they've accepted
    type: Number, required: true, index: true, default: 0,
  },
  pearsSentCount: { // number of times they've sent a request for a friend
    type: Number, required: true, index: true, default: 0,
  },
  pearsReceivedCount: { // number of times a friend has sent a request for them
    type: Number, required: true, index: true, default: 0,
  },
  pearsRejectedCount: { // number of times they've rejected a friend-sent request
    type: Number, required: true, index: true, default: 0,
  },
  pearsAcceptedCount: { // number of times they've accepted a friend-sent request
    type: Number, required: true, index: true, default: 0,
  },
  matchesCount: { // number of doubly-accepted matches they're a part of
    type: Number, required: true, index: true, default: 0,
  },
  profileCompletedTime: { type: Date, required: false },

  school: { type: String, required: false },
  schoolYear: { type: String, required: false },
  schoolEmail: { type: String, required: false },
  schoolEmailVerified: { type: Boolean, required: false, default: false },
  work: { type: String, required: false },
  jobTitle: { type: String, required: false },
  hometown: { type: String, required: false },
  isSeeking: { type: Boolean, required: true, default: true },

  displayedImages: { type: [ImageContainerSchema], required: true, default: [] },
  displayedImagesCount: {
    type: Number,
    required: true,
    index: true,
    default: 0,
  },
  bankImages: { type: [ImageContainerSchema], required: true, default: [] },

  discoveryQueue_id: { type: Schema.Types.ObjectId, required: true },
  actionSummary_id: { type: Schema.Types.ObjectId, required: true },

  matchingDemographics: {
    type: MatchingDemographicsSchema,
    required: true,
    default: () => ({}),
  },
  matchingPreferences: {
    type: MatchingPreferencesSchema,
    required: true,
    default: () => ({}),
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
    type: Boolean, required: true, default: false,
  },
  lowQuality: {
    type: Boolean, required: true, default: false,
  },
  lastActiveTimes: {
    type: [Date],
    required: true,
    index: true,
    default: [new Date()],
  },
  lastEditedTimes: {
    type: [Date],
    required: true,
    index: true,
    default: [new Date()],
  },
  lastActive: {
    type: Date,
    required: true,
    index: true,
    default: new Date(),
  },
  hostingEventIDs: { type: [Schema.Types.ObjectId], required: true, default: [] },

}, { timestamps: true });

UserSchema.virtual('fullName')
  .get(function fullName() {
    if (!this.firstName) {
      return null;
    }
    if (this.firstName && !this.lastName) {
      return this.firstName;
    }
    return `${this.firstName} ${this.lastName}`;
  });

export const User = mongoose.model('User', UserSchema);

export const createUserObject = (userInput, skipTimestamps) => {
  const userModel = new User(userInput);
  return userModel.save({ timestamps: !skipTimestamps })
    .catch((err) => {
      debug(`error occurred: ${err}`);
      return null;
    });
};

export const receiveRequest = (me, otherUser, match_id, isFromFriend) => {
  me.edgeSummaries.push({
    otherUser_id: otherUser._id,
    match_id,
  });
  if (isFromFriend) {
    me.pearsReceivedCount += 1;
  } else {
    me.matchRequestsReceivedCount += 1;
  }
  me.requestedMatch_ids.push(match_id);
  return me.save();
};

export const sendRequest = (me, otherUser, match_id) => {
  me.personalMatchesSentCount += 1;
  me.edgeSummaries.push({
    otherUser_id: otherUser._id,
    match_id,
  });
  return me.save();
};
