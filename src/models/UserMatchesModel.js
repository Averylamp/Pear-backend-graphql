const mongoose = require('mongoose');

const { Schema } = mongoose;

export const typeDef = `
type UserMatches{
  _id: ID!
  user_id: ID!
  userObj: User!
  alreadyMatchedUser_ids:[ID!]!
  matchRequest_ids: [ID!]!
  matchRequestObjs: [MatchRequest!]!
  matchRejected_ids: [ID!]!
  matchRejectedObjs: [MatchRequest!]!
  matches_ids: [ID!]!
  matchesObjs: [Match!]!
}
`;

export const resolvers = {
  Query: {

  },
  UserMatches: {

  },
};

const UserMatchesSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  alreadyMatchedUser_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  matchRequest_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  matchRejected_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
  matches_ids: {
    type: [Schema.Types.ObjectId], required: true, index: true, default: [],
  },
});


// userObj: User!
// matchRequestObjs: [MatchRequest!]!
// matchRejectedObjs: [MatchRequest!]!
// matchesObjs: [Match!]!
export const UserMatches = mongoose.model('UserMatches', UserMatchesSchema);


export const createUserMatchesObject = function
createUserMatchesObject(userMatchesInput) {
  const userMatchesModel = new UserMatches(userMatchesInput);
  return new Promise((resolve, reject) => {
    userMatchesModel.save((err) => {
      if (err) {
        reject(err);
      }
      resolve(userMatchesModel);
    });
  });
};
