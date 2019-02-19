var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  firebaseToken: { type: String, required: true },
  facebookId: { type: String, required: false },
  facebookAccessToken: { type: String, required: false },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true, match: "+1^\d{10}$" },
  fullName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  thumbnailURL: { type: String, required: false },
  gender: { type: String, required: false, enum: ["male", "female", "nonbinary"] },
  locationName: { type: String, required: false },
  locationCoordinates: { type: String, required: false },
  school: { type: String, required: false },
  age: { type: Number, required: false, min: 18, max: 80, index: true },
  ethnicities: { type: [String], required: true },
  profile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  endorsedProfile_ids: { type: [Schema.Types.ObjectId], required: true, index: true },

  userMatches_id: { type: Schema.Types.ObjectId, required: true },

  userStatData: {
    toatlNumberOfMatchRequests: { type: Number, required: true, default: 0 },
    totalNumberOfMatches: { type: Number, required: true, default: 0 },
    totalNumberOfProfilesCreated: { type: Number, required: true, default: 0 },
    totalNumberOfEndorsementsCreated: { type: Number, required: true, default: 0 },
    conversationTotalNumber: { type: Number, required: true, default: 0 },
    conversationTotalNumberFirstMessage: { type: Number, required: true, default: 0 },
    conversationTotalNumberTenMessages: { type: Number, required: true, default: 0 },
    conversationTotalNumberHundredMessages: { type: Number, required: true, default: 0 },
  },

  userPreferences: {
    ethnicities: { type: [String], required: true },
    seekingGender: { type: [String], required: true },
    seekingReason: { type: [String], required: true },
    reasonDealbreaker: { type: Number, required: true },
    seekingEthnicity: { type: [String], required: true },
    ethnicityDealbreaker: { type: Number, required: true, min: 1, max: 100 },
    maxDistance: { type: Number, required: true, min: 1, max: 100 },
    distanceDealbreaker: { type: Number, required: true, min: 1, max: 100 },
    minAgeRange: { type: Number, required: true, min: 1, max: 100 },
    maxAgeRange: { type: Number, required: true, min: 1, max: 100 },
    ageDealbreaker: { type: Number, required: true, min: 1, max: 100 },
    minHeightRange: { type: Number, required: true, min: 1, max: 100 },
    maxHeightRange: { type: Number, required: true, min: 1, max: 100 },
    heightDealbreaker: { type: Number, required: true, min: 1, max: 100 },
  },

})

// profile_objs: { type: [, required: true,  UserProfile!]!
// endorsedProfile_objs: { type: [, required: true,  UserProfile!]!
module.exports = mongoose.model("User", UserSchema)
