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

export const recordActivity = ({ user }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id],
    description: '$0 logged in',
  };
  recordAction({ user_id: user._id, action });
};

export const recordCreateUser = ({ user }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id],
    description: '$0 created account',
  };
  recordAction({ user_id: user._id, action });
};

export const recordUpdateUser = ({ updateUserInput }) => {
  const action = {
    actor_id: updateUserInput.user_id,
    user_ids: [updateUserInput.user_id],
    description: `$0 updated fields: ${Object.keys(updateUserInput).filter(key => key !== 'user_id')}`,
  };
  recordAction({ user_id: updateUserInput.user_id, action });
};

export const recordUpdateUserPhotos = ({ updateUserPhotosInput }) => {
  const action = {
    actor_id: updateUserPhotosInput.user_id,
    user_ids: [updateUserPhotosInput.user_id],
    description: `$0 updated photos: ${updateUserPhotosInput.displayedImages.length} displayed images`,
  };
  recordAction({ user_id: updateUserPhotosInput.user_id, action });
};

export const recordEditEndorsement = ({ editEndorsementInput }) => {
  const action = {
    actor_id: editEndorsementInput.endorser_id,
    user_ids: [editEndorsementInput.endorser_id, editEndorsementInput.user_id],
    description: `$0 edited ${(editEndorsementInput.questionResponses || []).length} prompts for $1`,
  };
  recordAction({ user_id: editEndorsementInput.endorser_id, action });
  recordAction({ user_id: editEndorsementInput.user_id, action });
};

export const recordSentMessage = ({ fromUser_id, toUser_id }) => {
  const action = {
    actor_id: fromUser_id,
    user_ids: [fromUser_id, toUser_id],
    description: '$0 sent a message to $1',
  };
  recordAction({ user_id: fromUser_id, action });
  recordAction({ user_id: toUser_id, action });
};

export const recordCreateMatch = ({
  sentByUser_id,
  sentForUser_id,
  receivedByUser_id,
  match_id,
}) => {
  let action = {};
  if (sentByUser_id === sentForUser_id) {
    action = {
      actor_id: sentByUser_id,
      user_ids: [sentByUser_id, receivedByUser_id],
      description: `match ${match_id}: $0 sent a match request to $1`,
    };
    recordAction({ user_id: sentByUser_id, action });
    recordAction({ user_id: receivedByUser_id, action });
  } else {
    action = {
      actor_id: sentByUser_id,
      user_ids: [sentByUser_id, sentForUser_id, receivedByUser_id],
      description: `match ${match_id}: $0 sent a match request on behalf of $1 to $2`,
    };
    recordAction({ user_id: sentByUser_id, action });
    recordAction({ user_id: sentForUser_id, action });
    recordAction({ user_id: receivedByUser_id, action });
  }
};

export const recordAcceptMatchRequest = ({ user, match, otherUser }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id, otherUser._id],
    description: `match ${match._id}: $0 accepted match request with $1`,
  };
  recordAction({ user_id: user._id, action });
  recordAction({ user_id: otherUser._id, action });
};

export const recordRejectMatchRequest = ({ user, match, otherUser }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id, otherUser._id],
    description: `match ${match._id}: $0 rejected match request with $1`,
  };
  recordAction({ user_id: user._id, action });
  recordAction({ user_id: otherUser._id, action });
};

export const recordMatchOpened = ({
  user, match, otherUser, matchmaker,
}) => {
  const action = {
    actor_id: user._id, // actor is the last user who accepts
    user_ids: [user._id, otherUser._id],
    description: `match ${match._id}: $0 and $1 matched`,
  };
  recordAction({ user_id: user._id, action });
  recordAction({ user_id: otherUser._id, action });
  if (matchmaker) {
    const matchmakerAction = {
      actor_id: user._id,
      user_ids: [user._id, otherUser._id, matchmaker._id],
      description: `match ${match._id}: $0 and $1 matched (initiated by $2)`,
    };
    recordAction({ user_id: matchmaker._id, matchmakerAction });
  }
};

// export const record
