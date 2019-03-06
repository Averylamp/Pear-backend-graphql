import { createUserMatchesObject } from './usermatchesmodel';
import { createDiscoveryObject } from './discoverymodel';
import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './matchingschemas';
import { GeoJSONSchema } from './typeschemas';

const mongoose = require('mongoose');

const { Schema } = mongoose;
const $ = require('mongo-dot-notation');
const debug = require('debug')('dev:User');
const firebaseAdmin = require('firebase-admin');

const serviceAccount = require('../../pear-firebase-adminsdk.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://pear-59123.firebaseio.com',
});

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
  birthdate: String
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
  firebaseToken: String
  firebaseAuthID: String
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

  profile_ids: [ID!]!
  profile_objs: [UserProfile!]!
  endorsedProfile_ids: [ID!]!
  endorsedProfile_objs: [UserProfile!]!

  userStats: UserStats!

  matchingPreferences: MatchingPreferences!
  matchingDemographics: MatchingDemographics!

  userMatches_id: ID!
  userMatches: UserMatches!
  discovery_id: ID!
  discovery_obj: Discovery!
  pearPoints: Int
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
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  thumbnailURL: { type: String, required: false },
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary'] },
  locationName: { type: String, required: false },
  locationCoordinates: { type: GeoJSONSchema, required: false },
  school: { type: String, required: false },
  schoolEmail: { type: String, required: false },
  schoolEmailVerified: { type: Boolean, required: false, default: false },
  birthdate: { type: Date, required: true },
  age: {
    type: Number, required: true, min: 18, max: 100, index: true,
  },
  profile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  endorsedProfile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  userMatches_id: { type: Schema.Types.ObjectId, required: true },
  discovery_id: { type: Schema.Types.ObjectId, required: true },

  pearPoints: { type: Number, required: true, default: 0 },

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


// profile_objs: { type: [, required: true,  UserProfile!]!
// endorsedProfile_objs: { type: [, required: true,  UserProfile!]!
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


export const resolvers = {
  Query: {
    user: async (_source, { id }, { dataSources }) => {
      debug(`Getting user by id: ${id}`);
      return dataSources.usersDB.findOne({ _id: id });
    },
  },
  User: {
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      debug(userInput);
      const userObjectID = mongoose.Types.ObjectId();
      const userMatchesObjectID = mongoose.Types.ObjectId();
      const discoveryObjectID = mongoose.Types.ObjectId();
      debug(`IDs:${userObjectID}, ${userMatchesObjectID}, ${discoveryObjectID}`);

      const finalUserInput = userInput;
      finalUserInput.userMatches_id = userMatchesObjectID;
      finalUserInput.discovery_id = discoveryObjectID;
      const createUserObj = createUserObject(finalUserInput, userObjectID)
        .catch(err => err);

      const createUserMatchesObj = createUserMatchesObject(
        { user_id: userObjectID }, userMatchesObjectID,
      )
        .catch(err => err);

      const createDiscoveryObj = createDiscoveryObject(
        { user_id: userObjectID }, discoveryObjectID,
      )
        .catch(err => err);

      return Promise.all([createUserObj, createUserMatchesObj, createDiscoveryObj])
        .then(([userObject, userMatchesObject, discoveryObject]) => {
          if (userObject instanceof Error
          || userMatchesObject instanceof Error
          || discoveryObject instanceof Error) {
            let message = '';
            if (userObject instanceof Error) {
              message += userObject.toString();
            } else {
              userObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove user object${err}`);
                } else {
                  debug('Removed created user object successfully');
                }
              });
            }
            if (userMatchesObject instanceof Error) {
              message += userMatchesObject.toString();
            } else {
              userMatchesObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove user matches object${err}`);
                } else {
                  debug('Removed created user matches object successfully');
                }
              });
            }
            if (discoveryObject instanceof Error) {
              message += discoveryObject.toString();
            } else {
              discoveryObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove discovery object${err}`);
                } else {
                  debug('Removed created discovery object successfully');
                }
              });
            }
            return {
              success: false,
              message,
            };
          }
          return {
            success: true,
            user: userObject,
          };
        });
    },
    getUser: async (_source, { userInput }) => {
      debug(userInput);
      const idToken = userInput.firebaseToken;
      const uid = userInput.firebaseAuthID;
      return new Promise(resolve => firebaseAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          debug('Decoded token');
          const firebaseUID = decodedToken.uid;
          debug(firebaseUID);
          debug(uid);
          if (uid === firebaseUID) {
            debug('tokenUID matches provided UID');
            const user = User.findOne({ firebaseAuthID: uid });
            if (user) {
              resolve({
                success: true,
                message: 'Successfully fetched',
                user,
              });
            } else {
              resolve({
                success: false,
                message: 'Failed to fetch user',
              });
            }
          }
        }).catch((error) => {
          debug('Failed to Decoded token');
          // Handle error
          debug(error);
          resolve({
            success: false,
            message: 'Failed to verify token',
          });
        }));
    },
    updateUser: async (_source, { id, updateUserInput }) => {
      const finalUpdateUserInput = $.flatten(updateUserInput);
      return new Promise(resolve => User.findByIdAndUpdate(
        id, finalUpdateUserInput, { new: true, runValidators: true },
        (err, user) => {
          if (err) {
            resolve({
              success: false,
              message: err.toString(),
            });
          } else {
            resolve({
              success: true,
              user,
              message: 'Successfully updated',
            });
          }
        },
      ));
    },
  },
};
