const mongoose = require('mongoose');

const { Schema } = mongoose;
// const $ = require('mongo-dot-notation');

const debug = require('debug')('dev:UserProfile');

const userProfileType = `
type UserProfile {
  _id: ID!
  creatorUser_id: ID!
  creatorObj: User
  creatorFirstName: String!
  user_id: ID!
  userObj: User

  interests: [String!]!
  vibes: [String!]!
  bio: String!
  dos: [String!]!
  donts: [String!]!

}

`;

const userProfileMutationResponse = `
type UserProfileMutationResponse{
  success: Boolean!
  message: String
  userProfile: UserProfile
}
`;


export const typeDef = userProfileType
+ userProfileMutationResponse;


const UserProfileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  creatorUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  creatorFirstName: { type: String, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  interests: { type: [String], required: true },
  vibes: { type: [String], required: true },
  bio: { type: String, required: true },
  dos: { type: [String], required: true },
  donts: { type: [String], required: true },
}, { timestamps: true });


export const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

export const createUserProfileObject = function createUserProfileObject(userProfileInput) {
  const userProfileModel = new UserProfile(userProfileInput);
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
