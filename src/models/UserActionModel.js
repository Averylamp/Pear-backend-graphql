const mongoose = require('mongoose');
// const debug = require('debug')('dev:UserActionModel');
const errorLog = require('debug')('error:UserActionModel');

const { Schema } = mongoose;

const actionType = `
type UserActionSummary {
  _id: ID!
  user_id: ID!
  user: User
  actions: [UserAction!]!
}

type UserAction {
  _id: ID!
  actor_id: ID!
  actor: User
  user_ids: [ID!]!
  users: [User]!
  description: String!
  timestamp: String!
}
`;

export const typeDef = actionType;

const UserActionSchema = new Schema({
  actor_id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_ids: {
    type: [Schema.Types.ObjectId],
    required: true,
    index: true,
    default: [],
  },
  description: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date },
});

const UserActionSummarySchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  actions: { type: [UserActionSchema], required: true, default: [] },
});

export const UserActionSummary = mongoose.model('UserActionSummary', UserActionSummarySchema);

// user action summary created when user is created
export const createActionSummaryObject = function createActionSummaryObject({ user_id, _id }) {
  const actionSummary = new UserActionSummary({ user_id, _id });
  return actionSummary.save();
};

export const recordAction = ({ user_id, action }) => {
  const actionReassign = action; // because no-param-reassign
  actionReassign.timestamp = new Date();
  return UserActionSummary.findOneAndUpdate({
    user_id,
  }, {
    $push: {
      actions: actionReassign,
    },
  })
    .exec()
    .then(() => true)
    .catch((err) => {
      errorLog(`error occurred recording action: ${err}`);
      return false;
    });
};

/*
export const recordActivity = ({ user }) => {

};

export const recordCreateMatch = ({ match }) => {

};
*/

// export const record
