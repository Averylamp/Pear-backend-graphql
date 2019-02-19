var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MatchRequestSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  matchRequest_id: { type: Schema.Types.ObjectId, required: true },
  firstPersonUser_id: { type: Schema.Types.ObjectId, required: true },
  firstPersonProfile_id: { type: Schema.Types.ObjectId, required: true },
  secondPersonUser_id: { type: Schema.Types.ObjectId, required: true },
  secondPersonProfile_id: { type: Schema.Types.ObjectId, required: true },
  timestampCreated: { type: Date, required: true},
  conversationFirstMessageSent: { type: Boolean, required: true, default: false},
  conversationTenMessagesSent: { type: Boolean, required: true, default: false},
  conversationHundredMessagesSent: { type: Boolean, required: true, default: false},
  firebaseConversationDocumentID: { type: String, required: true},
})


// matchRequest_obj: MatchRequest
// firstPersonUser_obj: User!
// firstPersonProfile_obj: UserProfile!
// secondPersonUser_obj: User!
// secondPersonProfile_obj: UserProfile!
module.exports = mongoose.model("MatchRequest", MatchRequestSchema)
