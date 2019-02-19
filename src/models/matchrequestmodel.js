var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `
type MatchRequest{
  _id: ID!

  firstPersonMessageRequest: String!
  secondPersonMessageRequest: String!

  firstPersonEndorserUser_id: ID!
  firstPersonEndorserUser_obj: User!
  secondPersonEndorserUser_id: ID!
  secondPersonEndorserUser_obj: User!

  firstPersonUser_id: ID!
  firstPersonUser_obj: User!
  firstPersonProfile_id: ID!
  firstPersonProfile_obj: UserProfile!
  secondPersonUser_id: ID!
  secondPersonUser_obj: User!
  secondPersonProfile_id: ID!
  secondPersonProfile_obj: UserProfile!

  timestampCreated: Date!
  firstPersonResponse: MatchResponse
  firstPersonResponseTimestamp: Date
  secondPersonResponse: MatchResponse
  secondPersonResponseTimestamp: Date

  matchStatus: MatchStatus!
  matchStatusTimestamp: Date!
  matchCreated: Boolean!
  acceptedMatch_id: ID
  acceptedMatch_obj: Match
}

enum MatchStatus{
  requests
  rejected
  accepted
}

enum MatchResponse{
  unseen
  seen
  rejected
  accepted
}

`


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
export const MatchRequest = mongoose.model("MatchRequest", MatchRequestSchema)
