var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `
type UserMatches{
  _id: ID!
  user_id: ID!
  user_obj: User!
  matchRequest_ids: [ID!]!
  matchRequest_objs: [MatchRequest!]!
  matchRejected_ids: [ID!]!
  matchRejected_objs: [MatchRequest!]!
  matches_ids: [ID!]!
  matches_objs: [Match!]!
}
`

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
export const UserMatches = mongoose.model("UserMatches", UserMatchesSchema)
