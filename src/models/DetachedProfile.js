import { ImageContainerSchema } from './ImageSchemas';
import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import {
  BioSchema,
  BoastSchema, DontSchema, DoSchema, InterestSchema,
  QuestionUserResponseSchema,
  RoastSchema,
  VibeSchema,
} from './ContentModels';


const mongoose = require('mongoose');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # Queries for existing detached profiles
  findDetachedProfiles(phoneNumber: String!): [DetachedProfile!]!
}
`;

const mutationRoutes = `
extend type Mutation{
  # Creates a new detached profile and attaches it to the creator's profile
  createDetachedProfile(detachedProfileInput: CreationDetachedProfileInput!): DetachedProfileMutationResponse!
  
  # Changes the status of the detached profile from waitingSeen to waitingUnseen
  viewDetachedProfile(user_id: ID! detachedProfile_id: ID!): DetachedProfileMutationResponse!
  
  # updates status of existing detached profile, converts it into a User Profile and attaches the user profile to both the creator's and user's User Object
  # ID is optional, for testing only
  approveNewDetachedProfile(approveDetachedProfileInput: ApproveDetachedProfileInput!): UserMutationResponse!
  
  # creator can edit the detached profile
  editDetachedProfile(editDetachedProfileInput: EditDetachedProfileInput!): DetachedProfileMutationResponse!
  
  # deletes the detached profile
  deleteDetachedProfile(creator_id: ID!, detachedProfile_id: ID!): DetachedProfileMutationResponse
}
`;

const createDetachedProfileInput = `
input CreationDetachedProfileInput {
  _id: ID
  # The creator's User Object ID
  creatorUser_id: ID!
  creatorFirstName: String!
  firstName: String!
  lastName: String
  phoneNumber: String!
  gender: Gender
  
  boasts: [BoastInput!]!
  roasts: [RoastInput!]!
  questionResponses: [QuestionUserResponseInput!]!
  vibes: [VibeInput!]!
  
  # non-required
  bio: BioInput
  dos: [DoInput!]
  donts: [DontInput!]
  interests: [InterestInput!]
}
`;

const approveDetachedProfileInput = `
input ApproveDetachedProfileInput {
  # id of the user approving
  user_id: ID!
  # id of the profile
  detachedProfile_id: ID!
  # id of the creator user
  creatorUser_id: ID!
  
  boasts: [BoastInput!]!
  roasts: [RoastInput!]!
  questionResponses: [QuestionUserResponseInput!]!
  vibes: [VibeInput!]!
  
  # non-required
  bio: BioInput
  dos: [DoInput!]
  donts: [DontInput!]
  interests: [InterestInput!]
}
`;

const editDetachedProfileInput = `
input EditDetachedProfileInput {
  # id of the profile being edited
  _id: ID!
  # The creator's User Object ID
  creatorUser_id: ID!
  
  firstName: String
  lastName: String
  boasts: [BoastInput!]
  roasts: [RoastInput!]
  questionResponses: [QuestionUserResponseInput!]
  vibes: [VibeInput!]
  
  bio: BioInput
  dos: [DoInput!]
  donts: [DontInput!]
  interests: [InterestInput!]
  
  images: [CreateImageContainer!]
  school: String
  schoolYear: String
}
`;

const detachedProfileType = `
type DetachedProfile {
  _id: ID!
  status: DetachedProfileStatus!
  creatorUser_id: ID!
  creatorUser: User
  creatorFirstName: String!
  creatorThumbnailURL: String
  firstName: String!
  lastName: String
  phoneNumber: String!
  age: Int
  gender: Gender
  
  boasts: [Boast!]!
  roasts: [Roast!]!
  questionResponses: [QuestionUserResponse!]!
  vibes: [Vibe!]!
  
  bio: Bio
  dos: [Do!]!
  donts: [Dont!]!
  interests: [Interest!]!
  
  images: [ImageContainer!]!
  school: String
  schoolYear: String

  matchingDemographics: MatchingDemographics!
  matchingPreferences: MatchingPreferences!
}

enum DetachedProfileStatus {
  waitingUnseen
  waitingSeen
  declined
  accepted
}
`;

const detachedProfileMutationResponse = `
type DetachedProfileMutationResponse{
  success: Boolean!
  message: String
  detachedProfile: DetachedProfile
}
`;

export const typeDef = queryRoutes
  + mutationRoutes
  + createDetachedProfileInput
  + approveDetachedProfileInput
  + editDetachedProfileInput
  + detachedProfileType
  + detachedProfileMutationResponse;


const DetachedProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  status: {
    type: String, required: true, enum: ['waitingUnseen', 'waitingSeen', 'declined', 'accepted'], default: 'waitingUnseen',
  },
  creatorUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  creatorFirstName: { type: String, required: true },
  creatorThumbnailURL: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: false },
  phoneNumber: {
    type: String,
    required: true,
    validate: { validator(v) { return /\d{10}$/.test(v) && v.length === 10; } },
    index: true,
  },
  age: { type: Number, required: false },
  gender: { type: String, required: false, enum: ['male', 'female', 'nonbinary'] },

  bio: { type: BioSchema, required: false },
  boasts: { type: [BoastSchema], required: true, default: [] },
  roasts: { type: [RoastSchema], required: true, default: [] },
  questionResponses: { type: [QuestionUserResponseSchema], required: true, default: [] },
  vibes: { type: [VibeSchema], required: false, default: [] },

  // dos, donts, interests are not used currently
  dos: { type: [DoSchema], required: true, default: [] },
  donts: { type: [DontSchema], required: true, default: [] },
  interests: { type: [InterestSchema], required: true, default: [] },

  school: { type: String, required: false },
  schoolYear: { type: String, required: false },
  images: { type: [ImageContainerSchema], required: true, default: [] },
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

  // not in graphql schema because once this is set, the DP should never be queried for
  endorsedUser_id: {
    type: Schema.Types.ObjectId, required: false, index: true, sparse: true,
  },
  acceptedTime: {
    type: Date, required: false, index: true, sparse: true,
  },
}, { timestamps: true });


export const DetachedProfile = mongoose.model('DetachedProfile', DetachedProfileSchema);

export const createDetachedProfileObject = function
createUserProfileObject(detachedProfileInput, skipTimestamps) {
  const detachedProfileModel = new DetachedProfile(detachedProfileInput);
  return detachedProfileModel.save({ timestamps: !skipTimestamps });
};
