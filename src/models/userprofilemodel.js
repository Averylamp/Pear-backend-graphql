import { createDiscoveryObject as createDiscoveryObject } from "./discoverymodel.js"

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `

extend type Mutation {
  createUserProfile(userProfileInput: CreationUserProfileInput): UserProfileMutationResponse
  updateUserProfile(id: ID, updateUserProfileInput: UpdateUserProfileInput) : UserProfileMutationResponse
}

input CreationUserProfileInput {
  creator_id: ID!
  firstName: String!
  lastName: String!
  demographics: CreationUserProfileDemographicsInput!
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
  creator_obj: User!
  user_id: ID
  user_obj: User
  activeProfile: Boolean!
  activeDiscovery: Boolean!
  fullName: String!
  firstName: String!
  lastName: String!

  demographics: ProfileDemographics!

  profileImageIDs: [String!]!
  profileImages: ImageSizes!
  discovery_id: ID!
  discovery_obj: Discovery!
  userProfileData: UserProfileData!
}

type ProfileDemographics{
  gender: Gender!
  age: Int!
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

type UserProfileData{
  totalProfileViews: Int!
  totalProfileLikes: Int!
}

type ImageSizes{
  original: [ImageMetadata!]!
  large:    [ImageMetadata!]!
  medium:   [ImageMetadata!]!
  small:    [ImageMetadata!]!
  thumb:    [ImageMetadata!]!
}

type ImageMetadata{
  imageURL: String!
  imageID: String!
  imageSize: ImageSize!
}

type ImageSize{
  width: Int!
  height: Int!
}

enum Gender{
  male
  female
  nonbinary
}
`


var UserProfileSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  creator_id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, required: false, index: true },
  activeProfile: { type: Boolean, required: true, defualt: false },
  activeDiscovery: { type: Boolean, required: true, defualt: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  demographics:  {
    gender: { type: String, required: true, enum: ["male", "female", "nonbinary"], index: true },
    age: { type: Number, required: true, min: 18, max: 80, index: true },
    height: { type: Number, required: false, min: 20, max: 100, index: true },
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
    totalProfileViews: { type: Number, required: true, min: 0, default: 0 },
    totalProfileLikes: { type: Number, required: true, min: 0, default: 0 },
  },

  profileImageIDs: { type: [String], required: true, default: [] },
  profileImages: {
    original: { type: [ Schema.Types.Mixed], required: true, default: [] },
    large: { type: [ Schema.Types.Mixed], required: true, default: [] },
    medium: { type: [ Schema.Types.Mixed], required: true, default: []  },
    small: { type: [ Schema.Types.Mixed], required: true, default: [] },
    thumb: { type: [ Schema.Types.Mixed], required: true, default: [] },
  },

  discovery_id: { type: Schema.Types.ObjectId, required: true },

})

UserProfileSchema.virtual("fullName").get(function () {
  return this.firstName + " " + this.lastName
})


// creator_obj: User!
// user_obj: User!
// discovery_obj: Discovery!

export const UserProfile = mongoose.model("UserProfile", UserProfileSchema)

export const createUserProfileObject = function createUserProfileObject(userProfileInput, _id = mongoose.Types.ObjectId()) {
  var userProfileModel = new UserProfile(userProfileInput)
  userProfileModel._id = _id
  userProfileModel.activeProfile = false
  userProfileModel.activeDiscovery = false
  console.log(userProfileModel)
  return new Promise((resolve, reject) => {
    userProfileModel.save(function (err) {
      if (err) {
        console.log(err)
        reject(err)
      }
      resolve(userProfileModel)
    })
  })
}



export const resolvers = {
  Query: {

  },
  UserProfile: {

  },
  Mutation: {
    createUserProfile: async (_source, {userProfileInput}, { dataSources }) => {

      var userProfileObject_id = mongoose.Types.ObjectId()
      var discoveryObject_id = mongoose.Types.ObjectId()
      console.log("IDs:" + userProfileObject_id + ", " + discoveryObject_id )
      console.log(userProfileInput)
      userProfileInput.discovery_id = discoveryObject_id
      var createUserProfileObj = createUserProfileObject(userProfileInput, userProfileObject_id).catch(function(err){ return err});

      var createDiscoveryObj = createDiscoveryObject({ profile_id: userProfileObject_id }, discoveryObject_id).catch(function(err){ return err });

      return Promise.all([createUserProfileObj, createDiscoveryObj]).then(function ([userProfileObject, discoveryObject]) {
        if (userProfileObject instanceof Error || discoveryObject instanceof Error){
            var message = ""
            if (userProfileObject instanceof Error) {
              message += userProfileObject.toString()
            }else{
              userProfileObject.remove(function (err) {
                if (err){
                  console.log("Failed to remove user profile object" + err)
                }else {
                  console.log("Removed created user profile object successfully")
                }
              })
            }
            if (discoveryObject instanceof Error){
              message += discoveryObject.toString()
            }else{
              discoveryObject.remove(function (err) {
                if (err){
                  console.log("Failed to remove discovery object" + err)
                }else {
                  console.log("Removed created discovery object successfully")
                }
              })
            }
            return {
              success: false,
              message: message
            }
        }
        return {
          success: true,
          userProfile: userProfileObject
        }
      })

    },

  }
}
