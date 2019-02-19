var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserProfileSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  creator_id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },

  activeProfile: { type: Boolean, required: true},
  activeDiscovery: { type: Boolean, required: true},
  fullName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: false, enum: ["male", "female", "nonbinary"] },
  age: { type: Number, required: false, min: 18, max: 80, index: true },

  height: { type: Number, required: false, min: 20, max: 100, index: true },
  locationName: { type: String, required: false },
  locationCoordinates: { type: String, required: false },
  school: { type: String, required: false },
  profileImageIDs: { type: [String], required: true },
  profileImages: {
    original: { type: [ Schema.Types.Mixed], required: true },
    large: { type: [ Schema.Types.Mixed], required: true },
    medium: { type: [ Schema.Types.Mixed], required: true },
    small: { type: [ Schema.Types.Mixed], required: true },
    thumb: { type: [ Schema.Types.Mixed], required: true },
  },
  discovery_id: { type: Schema.Types.ObjectId, required: true },

  userProfileData: {
    totalProfileViews: { type: Number, required: true, min: 0, default: 0 },
    totalProfileLikes: { type: Number, required: true, min: 0, default: 0 },
  },
})


// creator_obj: User!
// user_obj: User!
// discovery_obj: Discovery!

module.exports = mongoose.model("UserProfile", UserProfileSchema)
