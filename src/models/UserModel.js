import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { ImageContainerSchema } from './ImageSchemas';
import { EdgeSummarySchema } from './MatchModel';
import { EndorsementEdgeSchema } from './EndorsementModels';
import { USERS_ALREADY_MATCHED_ERROR } from '../resolvers/ResolverErrorStrings';
import {
  BioSchema,
  BoastSchema, DontSchema, DoSchema, InterestSchema,
  QuestionUserResponseSchema,
  RoastSchema,
  VibeSchema,
} from './ContentModels';

const mongoose = require('mongoose');
const debug = require('debug')('dev:UserModel');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # Get a user by an ID
  user(id: ID): User
  # Get a user by firebase tokens
  getUser(userInput: GetUserInput!): UserMutationResponse!
  # send a push notification indicating new message
  notifyNewMessage(fromUser_id: ID!, toUser_id: ID!): Boolean!
  # return a sub-array of a list of phone numbers, representing users who are already on pear
  alreadyOnPear(myPhoneNumber: String!, phoneNumbers: [String!]!): [String!]!
  # get fake user count
  getUserCount: Int!
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

  # an endorser can edit the things they've written for a user
  editEndorsement(editEndorsementInput: EditEndorsementInput!): UserMutationResponse!
  
  # DEVMODE ONLY: delete a user object. when called from prod, this is no-op
  deleteUser(user_id: ID!): UserDeletionResponse!
  
  # adds an event code for the user
  addEventCode(user_id: ID!, code: String!): UserMutationResponse!
  
  # mark a profile as high quality
  markHighQuality(user_id: ID!): UserMutationResponse!
  
  # mark a profile as low quality
  markLowQuality(user_id: ID!): UserMutationResponse!
  
  # mark a profile as low quality
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
  firstName: String
  lastName: String
  thumbnailURL: String
  gender: Gender
  age: Int
  birthdate: String
  
  ethnicity: [EthnicityEnum]
  ethnicityVisible: Boolean
  educationLevel: EducationLevelEnum
  educationLevelVisible: Boolean
  religion: [ReligionEnum]
  religionVisible: Boolean
  politicalView: PoliticsEnum
  politicalViewVisible: Boolean
  drinking: HabitsEnum
  drinkingVisible: Boolean
  smoking: HabitsEnum
  smokingVisible: Boolean
  cannabis: HabitsEnum
  cannabisVisible: Boolean
  drugs: HabitsEnum
  drugsVisible: Boolean

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

const editEndorsementInput = `
input EditEndorsementInput {
  endorser_id: ID!
  user_id: ID!

  boasts: [BoastInput!]
  roasts: [RoastInput!]
  questionResponses: [QuestionUserResponseInput!]
  vibes: [VibeInput!]

  bio: BioInput
  dos: [DoInput!]
  donts: [DontInput!]
  interests: [InterestInput!]
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
  bios: [Bio!]!
  boasts: [Boast!]!
  roasts: [Roast!]!
  questionResponses: [QuestionUserResponse!]!
  vibes: [Vibe!]!

  # deprecating?
  dos: [Do!]!
  donts: [Dont!]!
  interests: [Interest!]!

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

  pearPoints: Int!

  # All users who have endorsed this user
  endorser_ids: [ID!]!
  endorsers: [User]!
  endorserCount: Int!

  # All users this user has endorsed
  endorsedUser_ids: [ID!]!
  endorsedUsers: [User]!
  endorsedUsersCount: Int!

  # All pending endorsements this user has created
  detachedProfile_ids: [ID!]!
  detachedProfiles: [DetachedProfile!]!
  detachedProfilesCount: Int!

  # metainfo about endorser/endorsee chats
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
  
  # events the user is a part of
  event_ids: [ID!]!
  events: [Event!]!

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
  + editEndorsementInput
  + userType
  + mutationResponse
  + genderEnum;

const UserSchema = new Schema({
  deactivated: { type: Boolean, required: true, default: false },
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
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  thumbnailURL: { type: String, required: false },
  gender: { type: String, required: false, enum: ['male', 'female', 'nonbinary'] },
  age: {
    type: Number, required: false, min: 18, max: 100, index: true, sparse: true,
  },
  birthdate: { type: Date, required: false },

  bios: { type: [BioSchema], required: true, default: [] },
  biosCount: {
    type: Number, required: true, index: true, default: 0,
  },
  boasts: { type: [BoastSchema], required: true, default: [] },
  roasts: { type: [RoastSchema], required: true, default: [] },
  questionResponses: { type: [QuestionUserResponseSchema], required: true, default: [] },
  questionResponsesCount: {
    type: Number, required: true, index: true, default: 0,
  },
  vibes: { type: [VibeSchema], required: true, default: [] },

  // dos, donts, interests are not used currently
  dos: { type: [DoSchema], required: true, default: [] },
  donts: { type: [DontSchema], required: true, default: [] },
  interests: { type: [InterestSchema], required: true, default: [] },

  school: { type: String, required: false },
  schoolYear: { type: String, required: false },
  schoolEmail: { type: String, required: false },
  schoolEmailVerified: { type: Boolean, required: false, default: false },
  work: { type: String, required: false },
  jobTitle: { type: String, required: false },
  hometown: { type: String, required: false },
  isSeeking: { type: Boolean, required: true, default: true },

  pearPoints: {
    type: Number,
    required: true,
    index: true,
    default: 0,
  },

  displayedImages: { type: [ImageContainerSchema], required: true, default: [] },
  displayedImagesCount: {
    type: Number,
    required: true,
    index: true,
    default: 0,
  },
  bankImages: { type: [ImageContainerSchema], required: true, default: [] },

  endorser_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  endorserCount: {
    type: Number, required: true, index: true, default: 0,
  },
  endorsedUser_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  endorsedUsersCount: {
    type: Number, required: true, index: true, default: 0,
  },
  detachedProfile_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  detachedProfilesCount: {
    type: Number, required: true, index: true, default: 0,
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
  lowQuality: {
    type: Boolean, required: false, default: false,
  },
  event_ids: {
    type: [Schema.Types.ObjectId], required: false, index: true, default: [],
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
