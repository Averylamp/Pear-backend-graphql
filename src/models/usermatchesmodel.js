var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `
type UserMatches{
  _id: ID!
  user_id: ID!
  user_obj: User!
  alreadyMatchedUser_ids:[ID!]!
  matchRequest_ids: [ID!]!
  matchRequest_objs: [MatchRequest!]!
  matchRejected_ids: [ID!]!
  matchRejected_objs: [MatchRequest!]!
  matches_ids: [ID!]!
  matches_objs: [Match!]!
}
`
export const resolvers = {
  Query: {

  },
  UserMatches: {

  }
}

var UserMatchesSchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  alreadyMatchedUser_ids: { type: [Schema.Types.ObjectId], required: true, index: true, default: [] },
  matchRequest_ids: { type: [Schema.Types.ObjectId], required: true, index: true, default: [] },
  matchRejected_ids: { type: [Schema.Types.ObjectId], required: true, index: true, default: [] },
  matches_ids: { type: [Schema.Types.ObjectId], required: true, index: true, default: [] },
})




// user_obj: User!
// matchRequest_objs: [MatchRequest!]!
// matchRejected_objs: [MatchRequest!]!
// matches_objs: [Match!]!
export const UserMatches = mongoose.model("UserMatches", UserMatchesSchema)


export const createUserMatchesObject = function createUserMatchesObject(userMatchesInput, _id = mongoose.Types.ObjectId()) {
  var userMatchesModel = new UserMatches(userMatchesInput)

  userMatchesModel._id = _id

  return new Promise((resolve, reject) => {
    userMatchesModel.save(function (err) {
      if (err){
        reject(err)
      }
      resolve( userMatchesModel )
    })
  })

}
