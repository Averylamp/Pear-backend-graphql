const mongoose = require('mongoose');

const { Schema } = mongoose;
// const $ = require('mongo-dot-notation');

const debug = require('debug')('dev:UserProfile');

export const typeDef = `

extend type Mutation {
  createUserProfile(userProfileInput: CreationUserProfileInput): UserProfileMutationResponse
  updateUserProfile(id: ID, updateUserProfileInput: UpdateUserProfileInput) : UserProfileMutationResponse
}

input CreationUserProfileInput {
  creator_id: ID!
  firstName: String!
  demographics: CreationUserProfileDemographicsInput!
  activeProfile: Boolean!
  activeDiscovery: Boolean!
}

input CreationUserProfileDemographicsInput {
  gender: Gender!
  age: Int!
}

input UpdateUserProfileInput {
  activeProfile: Boolean
  activeDiscovery: Boolean
  firstName: String
  lastName: String
  demographics: UpdateProfileDemographicsInput
  userProfileData: UpdateUserProfileDataInput
}

input UpdateProfileDemographicsInput {
  gender: Gender
  age: Int
  height: Int
  locationName: String
  locationCoordinates: String
  school: String
  ethnicities: [String!]
  religion: [String!]
  political: [String!]
  smoking: [String!]
  drinking: [String!]
}

input UpdateUserProfileDataInput{
  totalProfileViews: Int
  totalProfileLikes: Int
}

type UserProfileMutationResponse{
  success: Boolean!
  message: String
  userProfile: UserProfile
}

type UserProfile {
  _id: ID!
  creator_id: ID!
  creatorObj: User!
  user_id: ID
  userObj: User
  activeProfile: Boolean!
  activeDiscovery: Boolean!
  fullName: String!
  firstName: String!
  lastName: String!

  matchingDemographics: MatchingDemographics!
  matchingPreferencees: MatchingPreferences!

  locationName: String
  locationCoordinates: String

  profileImageIDs: [String!]!
  profileImages: ImageSizes!
  userProfileData: UserProfileData!
}


type UserProfileData{
  totalProfileViews: Int!
  totalProfileLikes: Int!
}


enum Gender{
  male
  female
  nonbinary
}
`;


const UserProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creator_id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, required: false, index: true },
  activeProfile: { type: Boolean, required: true, defualt: false },
  activeDiscovery: { type: Boolean, required: true, defualt: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

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

  discovery_id: { type: Schema.Types.ObjectId, required: true },

});

UserProfileSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});


// creatorObj: User!
// userObj: User!
// discoveryObj: Discovery!

export const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

export const createUserProfileObject = function
createUserProfileObject(userProfileInput, _id = mongoose.Types.ObjectId()) {
  const userProfileModel = new UserProfile(userProfileInput);
  userProfileModel._id = _id;
  debug(userProfileModel);
  return new Promise((resolve, reject) => {
    userProfileModel.save((err) => {
      if (err) {
        debug(err);
        reject(err);
      }
      resolve(userProfileModel);
    });
  });
};


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
    //
    //   return Promise.all(
    //     [createUserProfileObj],
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
