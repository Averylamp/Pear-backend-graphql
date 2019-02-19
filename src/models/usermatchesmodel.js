var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserMatchesSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  matchRequest_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  matchRejected_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
  matches_ids: { type: [Schema.Types.ObjectId], required: true, index: true },
})


// user_obj: User!
// matchRequest_objs: [MatchRequest!]!
// matchRejected_objs: [MatchRequest!]!
// matches_objs: [Match!]!

module.exports = mongoose.model("UserMatches", UserMatchesSchema)
