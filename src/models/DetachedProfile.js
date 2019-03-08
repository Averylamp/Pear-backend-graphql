import { ImageSizes } from './ImageSchemas';
import { MatchingDemographicsSchema, MatchingPreferencesSchema } from './MatchingSchemas';
import { User } from './UserModel';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const debug = require('debug')('dev:DetachedProfileResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');
// const $ = require('mongo-dot-notation');
//
// const debug = require('debug')('dev:DetachedProfile');

export const typeDef = `

extend type Query {
  findDetachedProfiles(phoneNumber: String): [DetachedProfile!]!
}

extend type Mutation{
  createDetachedProfile(detachedProfileInput: CreationDetachedProfileInput): DetachedProfileMutationResponse!
}


input CreationDetachedProfileInput {
  creatorUser_id: ID!
  firstName: String!
  phoneNumber: String!
  age: Int!
  gender: Gender!
  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!
  imageIDs: [String!]!
  images: CreateImageSizes!

}


type DetachedProfile {
  _id: ID!
  creatorUser_id: ID!
  firstName: String!
  phoneNumber: String!
  age: Int!
  gender: Gender!
  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!
  imageIDs: [String!]!
  images: ImageSizes!

  matchingDemographics: MatchingDemographics!
  matchingPreferences: MatchingPreferences!
}

type DetachedProfileMutationResponse{
  success: Boolean!
  message: String
  detachedProfile: DetachedProfile
}

`;


const DetachedProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creatorUser_id: { type: String, required: true, index: true },
  firstName: { type: String, required: true },
  phoneNumber: {
    type: String,
    required: true,
    validate: { validator(v) { return /\d{10}$/.test(v) && v.length === 10; } },
    index: true,
  },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary'] },
  interests: { type: [String], required: true },
  vibes: { type: [String], required: true },
  bio: { type: String, required: true },
  dos: { type: [String], required: true },
  donts: { type: [String], required: true },
  imageIDs: { type: [String], required: true, default: [] },
  images: { type: ImageSizes, required: true },
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

});


export const DetachedProfile = mongoose.model('DetachedProfile', DetachedProfileSchema);

export const createDetachedProfileObject = function
createUserProfileObject(detachedProfileInput) {
  const detachedProfileModel = new DetachedProfile(detachedProfileInput);
  return new Promise((resolve, reject) => {
    detachedProfileModel.save((err) => {
      if (err) {
        debug(err);
        reject(err);
      }
      resolve(detachedProfileModel);
    });
  });
};


export const resolvers = {
  Query: {
    findDetachedProfiles: async (_, { phoneNumber }) => {
      functionCallConsole('Find Detached Profile Called');
      debug(phoneNumber);
      return DetachedProfile.find(phoneNumber);
    },
  },
  DetachedProfile: {

  },
  Mutation: {
    createDetachedProfile: async (_, { detachedProfileInput }) => {
      functionCallConsole('Create Detached Profile Called');

      const detachedProfileID = mongoose.Types.ObjectId();
      const finalDetachedProfileInput = detachedProfileInput;
      finalDetachedProfileInput._id = detachedProfileID;

      const { creatorUser_id } = detachedProfileInput;

      const updateCreatorUserObject = User.findByIdAndUpdate(creatorUser_id, {
        $push: {
          detachedProfile_ids: detachedProfileID,
        },
      }, { new: true }).exec().then(err => err);

      const createDetachedProfileObj = createDetachedProfileObject(finalDetachedProfileInput)
        .catch(err => err);

      return Promise.all([updateCreatorUserObject, createDetachedProfileObj])
        .then(([newUser, detachedProfileObject]) => {
          if (newUser == null || detachedProfileObject instanceof Error) {
            let message = '';
            if (newUser == null) {
              message += 'Was unable to add Detached Profile to User\n';
            }
            if (detachedProfileObject instanceof Error) {
              message += 'Was unable to create Detached Profile Object';
              if (newUser) {
                User.findByIdAndUpdate(creatorUser_id, {
                  $pull: {
                    detachedProfile_ids: detachedProfileID,
                  },
                }, { new: true }, (err) => {
                  if (err) {
                    debug('Failed to remove Detached Profile ID from user');
                  } else {
                    debug('Successfully removed Detached Profile ID from user');
                  }
                });
              }
            } else {
              detachedProfileObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove discovery object${err}`);
                } else {
                  debug('Removed created discovery object successfully');
                }
              });
            }
            debug('Completed unsuccessfully');
            return {
              success: false,
              message,
            };
          }
          debug('Completed successfully');
          return {
            success: true,
            detachedProfile: detachedProfileObject,
          };
        });
    },

  },
};
