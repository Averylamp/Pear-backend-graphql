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
  actionType: UserActionType!
  timestamp: String!
}

enum UserActionType {
  LOGGED_ON
  CREATE_USER
  UPDATE_USER
  UPDATE_USER_PHOTOS
  EDIT_ENDORSEMENT
  SEND_MESSAGE
  SEND_PEAR
  MATCH_REQUEST
  ACCEPT_REQUEST
  REJECT_REQUEST
  MATCH_START
  UNMATCH
  SKIP_CARD
  SEND_FR
  ACCEPT_FR
  EDIT_DP
  UNKNOWN
}
`;

export const typeDef = actionType;

const ActionTypes = {
  LOGGED_ON: 'LOGGED_ON',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  UPDATE_USER_PHOTOS: 'UPDATE_USER_PHOTOS',
  EDIT_ENDORSEMENT: 'EDIT_ENDORSEMENT',
  SEND_MESSAGE: 'SEND_MESSAGE',
  SEND_PEAR: 'SEND_PEAR',
  MATCH_REQUEST: 'MATCH_REQUEST',
  ACCEPT_REQUEST: 'ACCEPT_REQUEST',
  REJECT_REQUEST: 'REJECT_REQUEST',
  MATCH_START: 'MATCH_START',
  UNMATCH: 'UNMATCH',
  SKIP_CARD: 'SKIP_CARD',
  SEND_FR: 'SEND_FR',
  ACCEPT_FR: 'ACCEPT_FR',
  EDIT_DP: 'EDIT_DP',
  JOIN_EVENT: 'JOIN_EVENT',
  UNKNOWN: 'UNKNOWN',
};

const UserActionSchema = new Schema({
  actor_id: { type: Schema.Types.ObjectId, required: true, index: true },
  user_ids: {
    type: [Schema.Types.ObjectId],
    required: true,
    index: true,
    default: [],
  },
  description: { type: String, required: true },
  actionType: {
    type: String,
    required: true,
    enum: Object.keys(ActionTypes),
    index: true,
    default: ActionTypes.UNKNOWN,
  },
  timestamp: { type: Date, required: true, default: Date },
});

const UserActionSummarySchema = new Schema({
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
    actionType: ActionTypes.LOGGED_ON,
  };
  recordAction({ user_id: user._id, action });
};

export const recordCreateUser = ({ user }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id],
    description: '$0 created account',
    actionType: ActionTypes.CREATE_USER,
  };
  recordAction({ user_id: user._id, action });
};

export const recordUpdateUser = ({ updateUserInput }) => {
  const action = {
    actor_id: updateUserInput.user_id,
    user_ids: [updateUserInput.user_id],
    description: `$0 updated fields: ${Object.keys(updateUserInput).filter(key => key !== 'user_id')}`,
    actionType: ActionTypes.UPDATE_USER,
  };
  recordAction({ user_id: updateUserInput.user_id, action });
};

export const recordUpdateUserPhotos = ({ updateUserPhotosInput }) => {
  const action = {
    actor_id: updateUserPhotosInput.user_id,
    user_ids: [updateUserPhotosInput.user_id],
    description: `$0 updated photos: ${updateUserPhotosInput.displayedImages.length} displayed images`,
    actionType: ActionTypes.UPDATE_USER_PHOTOS,
  };
  recordAction({ user_id: updateUserPhotosInput.user_id, action });
};

export const recordEditEndorsement = ({ editEndorsementInput }) => {
  const action = {
    actor_id: editEndorsementInput.endorser_id,
    user_ids: [editEndorsementInput.endorser_id, editEndorsementInput.user_id],
    description: `$0 edited ${(editEndorsementInput.questionResponses || []).length} prompts for $1`,
    actionType: ActionTypes.EDIT_ENDORSEMENT,
  };
  recordAction({ user_id: editEndorsementInput.endorser_id, action });
  recordAction({ user_id: editEndorsementInput.user_id, action });
};

export const recordSentMessage = ({ fromUser_id, toUser_id }) => {
  const action = {
    actor_id: fromUser_id,
    user_ids: [fromUser_id, toUser_id],
    description: '$0 sent a message to $1',
    actionType: ActionTypes.SEND_MESSAGE,
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
      actionType: ActionTypes.MATCH_REQUEST,
    };
    recordAction({ user_id: sentByUser_id, action });
    recordAction({ user_id: receivedByUser_id, action });
  } else {
    action = {
      actor_id: sentByUser_id,
      user_ids: [sentByUser_id, sentForUser_id, receivedByUser_id],
      description: `match ${match_id}: $0 sent a match request on behalf of $1 to $2`,
      actionType: ActionTypes.SEND_PEAR,
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
    actionType: ActionTypes.ACCEPT_REQUEST,
  };
  recordAction({ user_id: user._id, action });
  recordAction({ user_id: otherUser._id, action });
};

export const recordRejectMatchRequest = ({ user, match, otherUser }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id, otherUser._id],
    description: `match ${match._id}: $0 rejected match request with $1`,
    actionType: ActionTypes.REJECT_REQUEST,
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
    actionType: ActionTypes.MATCH_START,
  };
  recordAction({ user_id: user._id, action });
  recordAction({ user_id: otherUser._id, action });
  if (matchmaker) {
    const matchmakerAction = {
      actor_id: user._id,
      user_ids: [user._id, otherUser._id, matchmaker._id],
      description: `match ${match._id}: $0 and $1 matched (initiated by $2)`,
    };
    recordAction({ user_id: matchmaker._id, action: matchmakerAction });
  }
};

export const recordSkipCard = ({ user, skippedUser_id }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id, skippedUser_id],
    description: '$0 skipped $1 in discovery',
    actionType: ActionTypes.SKIP_CARD,
  };
  recordAction({ user_id: user._id, action });
};

export const recordUnmatch = ({ user, match, otherUser }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id, otherUser._id],
    description: `match ${match._id}: $0 unmatched $1`,
    actionType: ActionTypes.UNMATCH,
  };
  recordAction({ user_id: user._id, action });
  recordAction({ user_id: otherUser._id, action });
};

export const recordSendFR = ({ detachedProfileInput }) => {
  const action = {
    actor_id: detachedProfileInput.creatorUser_id,
    user_ids: [detachedProfileInput.creatorUser_id],
    description: `$0 created a DP for phone number ${detachedProfileInput.phoneNumber} with ${(detachedProfileInput.questionResponses || []).length} qrs`,
    actionType: ActionTypes.SEND_FR,
  };
  recordAction({ user_id: detachedProfileInput.creatorUser_id, action });
};

export const recordAcceptFR = ({ approveDetachedProfileInput, detachedProfile }) => {
  const action = {
    actor_id: approveDetachedProfileInput.user_id,
    user_ids: [approveDetachedProfileInput.user_id, approveDetachedProfileInput.creatorUser_id],
    description: `$0 approved profile from $1 with ${detachedProfile.questionResponses.length} prompts`,
    actionType: ActionTypes.ACCEPT_FR,
  };
  recordAction({ user_id: approveDetachedProfileInput.user_id, action });
  recordAction({ user_id: approveDetachedProfileInput.creatorUser_id, action });
};

export const recordEditDP = ({ creator, detachedProfile }) => {
  const action = {
    actor_id: creator._id,
    user_ids: [creator._id],
    description: `$0 edited DP for phone number ${detachedProfile.phoneNumber}`,
    actionType: ActionTypes.EDIT_DP,
  };
  recordAction({ user_id: creator._id, action });
};

export const recordJoinEvent = ({ user, event }) => {
  const action = {
    actor_id: user._id,
    user_ids: [user._id],
    description: `$0 joined event ${event.name}`,
    actionType: ActionTypes.JOIN_EVENT,
  };
  recordAction({ user_id: user._id, action });
};
