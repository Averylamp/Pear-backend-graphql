var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MatchRequestSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  firstPersonMessageRequest: { type: String, required: true },
  secondPersonMessageRequest: { type: String, required: true },
  firstPersonEndorserUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  secondPersonEndorserUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  firstPersonUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  firstPersonProfile_id: { type: Schema.Types.ObjectId, required: true, index: true },
  secondPersonUser_id: { type: Schema.Types.ObjectId, required: true, index: true },
  secondPersonProfile_id: { type: Schema.Types.ObjectId, required: true, index: true },

  timestampCreated: { type: Date, required: true},
  firstPersonResponse: { type: String, required: true, enum: ["unseen", "seen", "rejected", "accepted"] },
  firstPersonResponseTimestamp: { type: Date, required: true},
  secondPersonResponse: { type: String, required: true, enum: ["unseen", "seen", "rejected", "accepted"] },
  secondPersonResponseTimestamp: { type: Date, required: true},
  matchStatus: { type: String, required: true, enum: ["reuests", "rejected", "accepted"] },
  matchStatusTimestamp: { type: Date, required: true},
  matchCreated: { type: Boolean, required: true, default: false},
  acceptedMatch_id: { type: Schema.Types.ObjectId, required: false, index: true },
})


// firstPersonEndorserUser_obj: User!
// secondPersonEndorserUser_obj: User!
// firstPersonUser_obj: User!
// firstPersonProfile_obj: UserProfile!
// secondPersonUser_obj: User!
// secondPersonProfile_obj: UserProfile!
// acceptedMatch_obj: Match
module.exports = mongoose.model("MatchRequest", MatchRequestSchema)
