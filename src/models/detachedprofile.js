// import { createDiscoveryObject } from './discoverymodel';

const mongoose = require('mongoose');

const { Schema } = mongoose;
// const $ = require('mongo-dot-notation');
//
// const debug = require('debug')('dev:DetachedProfile');

export const typeDef = `

input CreationDetachedUserProfileInput {
  creator_id: ID!
  firstName: String!
  demographics: CreationUserProfileDemographicsInput!
  activeProfile: Boolean!
  activeDiscovery: Boolean!
}

input CreationDetachedUserProfileDemographicsInput {
  gender: Gender!
  age: Int!
}


type DetachedProfile {
  _id: ID!
  creator_id: ID!
  creator_obj: User!
  firstName: String!
  thumbnailURL: String

  matchingDemographics: MatchingDemographics!
  matchingPreferencees: MatchingPreferences!

  profileImageIDs: [String!]!
  profileImages: ImageSizes!
}


`;


const DetachedProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creator_id: { type: Schema.Types.ObjectId, required: true, index: true },
  firstName: { type: String, required: true },

  demographics: {
    gender: {
      type: String, required: true, enum: ['male', 'female', 'nonbinary'], index: true,
    },
    age: {
      type: Number, required: true, min: 18, max: 80, index: true,
    },
    height: {
      type: Number, required: false, min: 20, max: 100, index: true,
    },
    locationName: { type: String, required: false },
    locationCoordinates: { type: String, required: false },
    school: { type: String, required: false },
    ethnicities: { type: [String], required: false },
    religion: { type: [String], required: false },
    political: { type: [String], required: false },
    smoking: { type: [String], required: false },
    drinking: { type: [String], required: false },
  },

  userProfileData: {
    totalProfileViews: {
      type: Number, required: true, min: 0, default: 0,
    },
    totalProfileLikes: {
      type: Number, required: true, min: 0, default: 0,
    },
  },

  profileImageIDs: { type: [String], required: true, default: [] },
  profileImages: {
    original: { type: [Schema.Types.Mixed], required: true, default: [] },
    large: { type: [Schema.Types.Mixed], required: true, default: [] },
    medium: { type: [Schema.Types.Mixed], required: true, default: [] },
    small: { type: [Schema.Types.Mixed], required: true, default: [] },
    thumb: { type: [Schema.Types.Mixed], required: true, default: [] },
  },

  discovery_id: { type: Schema.Types.ObjectId, required: true },

  userPreferences: {
    ethnicities: { type: [String], required: true, default: ['No Preference'] },
    seekingGender: {
      type: [String], required: true, enum: ['male', 'female', 'nonbinary'], default: ['male', 'female', 'nonbinary'],
    },
    seekingReason: { type: [String], required: true, default: ['No Preference'] },
    reasonDealbreaker: {
      type: Number, required: true, min: 0, max: 1, default: 0,
    },
    seekingEthnicity: { type: [String], required: true, default: ['No Preference'] },
    ethnicityDealbreaker: {
      type: Number, required: true, min: 0, max: 1, default: 0,
    },
    maxDistance: {
      type: Number, required: true, min: 1, max: 100, default: 25,
    },
    distanceDealbreaker: {
      type: Number, required: true, min: 0, max: 1, default: 0,
    },
    minAgeRange: {
      type: Number, required: true, min: 18, max: 100, default: 18,
    },
    maxAgeRange: {
      type: Number, required: true, min: 18, max: 100, default: 40,
    },
    ageDealbreaker: {
      type: Number, required: true, min: 0, max: 1, default: 0,
    },
    minHeightRange: {
      type: Number, required: true, min: 40, max: 100, default: 40,
    },
    maxHeightRange: {
      type: Number, required: true, min: 40, max: 100, default: 100,
    },
    heightDealbreaker: {
      type: Number, required: true, min: 0, max: 1, default: 0,
    },
  },

});


// creator_obj: User!
// user_obj: User!
// discovery_obj: Discovery!

export const DetachedProfile = mongoose.model('DetachedProfile', DetachedProfileSchema);

// export const createUserProfileObject = function
// createUserProfileObject(userProfileInput, _id = mongoose.Types.ObjectId()) {
//   const userProfileModel = new UserProfile(userProfileInput);
//   userProfileModel._id = _id;
//   debug(userProfileModel);
//   return new Promise((resolve, reject) => {
//     userProfileModel.save((err) => {
//       if (err) {
//         debug(err);
//         reject(err);
//       }
//       resolve(userProfileModel);
//     });
//   });
// };


export const resolvers = {
  Query: {

  },
  UserProfile: {

  },
  Mutation: {
    // createUserProfile: async (_source, { userProfileInput }) => {
    //   const userProfileObjectID = mongoose.Types.ObjectId();
    //   const discoveryObjectID = mongoose.Types.ObjectId();
    //   debug(`IDs:${userProfileObjectID}, ${discoveryObjectID}`);
    //   debug(userProfileInput);
    //   const finalUserProfileInput = userProfileInput;
    //   finalUserProfileInput.discovery_id = discoveryObjectID;
    //   const createUserProfileObj = createUserProfileObject(
    //     finalUserProfileInput, userProfileObjectID,
    //   )
    //     .catch(err => err);
    //
    //   const createDiscoveryObj = createDiscoveryObject(
    //     { profile_id: userProfileObjectID }, discoveryObjectID,
    //   )
    //     .catch(err => err);
    //
    //   return Promise.all(
    //     [createUserProfileObj, createDiscoveryObj],
    //   )
    //     .then(([userProfileObject, discoveryObject]) => {
    //       if (userProfileObject instanceof Error || discoveryObject instanceof Error) {
    //         let message = '';
    //         if (userProfileObject instanceof Error) {
    //           message += userProfileObject.toString();
    //         } else {
    //           userProfileObject.remove((err) => {
    //             if (err) {
    //               debug(`Failed to remove user profile object${err}`);
    //             } else {
    //               debug('Removed created user profile object successfully');
    //             }
    //           });
    //         }
    //         if (discoveryObject instanceof Error) {
    //           message += discoveryObject.toString();
    //         } else {
    //           discoveryObject.remove((err) => {
    //             if (err) {
    //               debug(`Failed to remove discovery object${err}`);
    //             } else {
    //               debug('Removed created discovery object successfully');
    //             }
    //           });
    //         }
    //         return {
    //           success: false,
    //           message,
    //         };
    //       }
    //       return {
    //         success: true,
    //         userProfile: userProfileObject,
    //       };
    //     });
    // },
    // updateUserProfile: async (_source, { id, updateUserProfileInput }) => {
    //   debug(`Updating User Profile: ${id}`);
    //   debug(updateUserProfileInput);
    //   const flattenedUpdateUserProfileInput = $.flatten(updateUserProfileInput);
    //   debug(flattenedUpdateUserProfileInput);
    //   return new Promise(resolve => UserProfile.findByIdAndUpdate(
    //     id, flattenedUpdateUserProfileInput, { new: true, runValidators: true },
    //     (err, userProfile) => {
    //       if (err) {
    //         debug(err);
    //         resolve({
    //           success: false,
    //           message: err.toString(),
    //         });
    //       } else {
    //         debug(userProfile);
    //         resolve({
    //           success: true,
    //           userProfile,
    //           message: 'Successfully updated',
    //         });
    //       }
    //     },
    //   ));
    // },

  },
};
