import { createUserMatchesObject as createUserMatchesObject } from "./usermatchesmodel.js"
import { createDiscoveryObject as createDiscoveryObject } from "./discoverymodel.js"

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var $ = require('mongo-dot-notation')

export const typeDef = `
extend type Query {
  user(id: ID): User
  users: [User]
}

extend type Mutation{
  createUser(userInput: CreationUserInput): UserMutationResponse
  updateUser(id: ID, updateUserInput: UpdateUserInput) : UserMutationResponse
}

input CreationUserInput{
  email: String!
  emailVerified: Boolean!
  phoneNumber: String!
  phoneNumberVerified: Boolean!
  firstName: String!
  lastName: String!
  firebaseToken: String
  firebaseAuthID: String
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

input UserStatDataInput{
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
  birthdate: Int
  age: Int
  userPreferences: UserPreferencesInput
  userStatData: UserStatDataInput
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
  gender: Gender
  locationName: String
  locationCoordinates: String
  school: String
  schoolEmail: String
  schoolEmailVerified: Boolean
  birthdate: Int
  age: Int
  profile_ids: [ID!]!
  profile_objs: [UserProfile!]!
  endorsedProfile_ids: [ID!]!
  endorsedProfile_objs: [UserProfile!]!
  userPreferences: UserPreferences!
  userStatData: UserStatData!
  userDemographics: UserDemographics!
  userMatches_id: ID!
  userMatches: UserMatches!
  discovery_id: ID!
  discovery_obj: Discovery!
  pearPoints: Int
}

type UserDemographics{
  ethnicities: [String!]
  religion: [String!]
  political: [String!]
  smoking: [String!]
  drinking: [String!]
  height: Int
}


type UserStatData{
  totalNumberOfMatchRequests: Int!
  totalNumberOfMatches: Int!
  totalNumberOfProfilesCreated: Int!
  totalNumberOfEndorsementsCreated: Int!
  conversationTotalNumber: Int!
  conversationTotalNumberFirstMessage: Int!
  conversationTotalNumberTenMessages: Int!
  conversationTotalNumberHundredMessages: Int!
}

type UserPreferences{
  ethnicities: [String!]!
  seekingGender: [Gender!]!
  seekingReason: [String!]!
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


type UserMutationResponse{
  success: Boolean!
  message: String
  user: User
}

`
var UserSchema = new Schema ({
  deactivated : { type: Boolean, required: true, default: false},
  firebaseToken: { type: String, required: false },
  firebaseAuthID: { type: String, required: false },
  facebookId: { type: String, required: false },
  facebookAccessToken: { type: String, required: false },
  email: { type: String, required: false },
  emailVerified: { type: Boolean, required: true, default: false},
  phoneNumber: { type: String, required: true, validate: {
      validator: function(v) { return /\d{10}$/.test(v); }}, index: true },
  phoneNumberVerified: { type: Boolean, required: true, default: false},
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  thumbnailURL: { type: String, required: false },
  gender: { type: String, required: false, enum: ["male", "female", "nonbinary"] },
  locationName: { type: String, required: false },
  locationCoordinates: { type: String, required: false },
  school: { type: String, required: false },
  schoolEmail: { type: String, required: false },
  schoolEmailVerified: { type: Boolean, required: false, default: false },
  birthdate: { type: Date, required: false },
  age: { type: Number, required: false, min: 18, max: 100, index: true },
  profile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  endorsedProfile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  userMatches_id: { type: Schema.Types.ObjectId, required: true },
  discovery_id: { type: Schema.Types.ObjectId, required: true },

  pearPoints: { type: Number, required: true, default: 0 },

  userStatData: {
    totalNumberOfMatchRequests: { type: Number, required: true, default: 0 },
    totalNumberOfMatches: { type: Number, required: true, default: 0 },
    totalNumberOfProfilesCreated: { type: Number, required: true, default: 0 },
    totalNumberOfEndorsementsCreated: { type: Number, required: true, default: 0 },
    conversationTotalNumber: { type: Number, required: true, default: 0 },
    conversationTotalNumberFirstMessage: { type: Number, required: true, default: 0 },
    conversationTotalNumberTenMessages: { type: Number, required: true, default: 0 },
    conversationTotalNumberTwentyMessages: { type: Number, required: true, default: 0 },
    conversationTotalNumberHundredMessages: { type: Number, required: true, default: 0 },
  },

  userDemographics:  {
    ethnicities: { type: [String], required: false },
    religion: { type: [String], required: false },
    political: { type: [String], required: false },
    smoking: { type: [String], required: false },
    drinking: { type: [String], required: false },
    height: { type: Number, required: false },
  },

  userPreferences: {
    ethnicities: { type: [String], required: true, default: ["No Preference"] },
    seekingGender: { type: [String], required: true, enum: ["male", "female", "nonbinary"], default:  ["male", "female", "nonbinary"]},
    seekingReason: { type: [String], required: true, default: ["No Preference"] },
    reasonDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0 },
    seekingEthnicity: { type: [String], required: true, default: ["No Preference"] },
    ethnicityDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
    maxDistance: { type: Number, required: true, min: 1, max: 100, default: 25 },
    distanceDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
    minAgeRange: { type: Number, required: true, min: 18, max: 100, default: 18 },
    maxAgeRange: { type: Number, required: true, min: 18, max: 100, default: 40 },
    ageDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
    minHeightRange: { type: Number, required: true, min: 40, max: 100, default: 40 },
    maxHeightRange: { type: Number, required: true, min: 40, max: 100, default: 100 },
    heightDealbreaker: { type: Number, required: true, min: 0, max: 1, default: 0},
  },

})

UserSchema.virtual("fullName").get(function () {
  return this.firstName + " " + this.lastName
})


// profile_objs: { type: [, required: true,  UserProfile!]!
// endorsedProfile_objs: { type: [, required: true,  UserProfile!]!
export const User = mongoose.model("User", UserSchema)

export const createUserObject = function createUserObject(userInput, _id = mongoose.Types.ObjectId()) {
  var userModel = new User(userInput)

  userModel._id = _id

  return new Promise((resolve, reject) => {
    userModel.save(function (err) {
      if (err){
        reject(err)
      }
      resolve( userModel )
    })
  })

}


export const resolvers = {
  Query: {
    user: async (_source, {id}, { dataSources }) => {
      console.log("Getting user by id: " + id)
      return (await dataSources.usersDB.findOne({"_id":ObjectId(id)}))
    },
    users: async (_source, _args, { dataSources }) => {
      return (await dataSources.usersDB.find({}).toArray()).map(prepare)
    },
  },
  User: {
  },
  Mutation: {
    createUser: async (_source, { userInput }, { dataSources }) => {
      var userObject_id = mongoose.Types.ObjectId()
      var userMatchesObject_id = mongoose.Types.ObjectId()
      var discoveryObject_id = mongoose.Types.ObjectId()
      console.log("IDs:" + userObject_id + ", " + userMatchesObject_id + ", " + discoveryObject_id )

      userInput.userMatches_id = userMatchesObject_id
      userInput.discovery_id = discoveryObject_id
      var createUserObj = createUserObject(userInput, userObject_id).catch(function(err){ return err});

      var createUserMatchesObj = createUserMatchesObject({ user_id: userObject_id }, userMatchesObject_id).catch(function(err){ return err });

      var createDiscoveryObj = createDiscoveryObject({ user_id: userObject_id }, discoveryObject_id).catch(function(err){ return err });

      return Promise.all([createUserObj, createUserMatchesObj, createDiscoveryObj]).then(function ([userObject, userMatchesObject, discoveryObject]) {
        if (userObject instanceof Error || userMatchesObject instanceof Error || discoveryObject instanceof Error){
            var message = ""
            if (userObject instanceof Error) {
              message += userObject.toString()
            }else{
              userObject.remove(function (err) {
                if (err){
                  console.log("Failed to remove user object" + err)
                }else {
                  console.log("Removed created user object successfully")
                }
              })
            }
            if (userMatchesObject instanceof Error) {
              message += userMatchesObject.toString()
            }else{
              userMatchesObject.remove(function (err) {
                if (err){
                  console.log("Failed to remove user matches object" + err)
                }else {
                  console.log("Removed created user matches object successfully")
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
          user: userObject
        }
      })

    },
    updateUser: async (_source, { id, updateUserInput }, { dataSources }) => {
      updateUserInput = $.flatten(updateUserInput)
      return new Promise((resolve, reject) => User.findByIdAndUpdate(id, updateUserInput, { new: true, runValidators: true}, function (err, user) {
        if (err) {
          resolve ({
            success:false,
            message: err.toString()
          })
        }else{
          resolve({
            success: true,
            user: user,
            message: "Successfully updated"
          })
        }
      }))
    }
  }
}
