import {
  AVERY, BRIAN, JOSH, SAMMI, SOPHIA, UMA, MADE, MATCH1, MATCH2, MATCH3, MATCH4, MATCH5, MATCH6,
} from './TestsContants';

export const SEND_PERSONAL_REQUEST_1_VARIABLES = {
  requestInput: {
    _id: MATCH1,
    sentByUser_id: JOSH,
    sentForUser_id: JOSH,
    receivedByUser_id: SAMMI,
  },
};

export const SEND_PERSONAL_REQUEST_2_VARIABLES = {
  requestInput: {
    _id: MATCH2,
    sentByUser_id: SOPHIA,
    sentForUser_id: SOPHIA,
    receivedByUser_id: AVERY,
  },
};

export const SEND_MATCHMAKER_REQUEST_3_VARIABLES = {
  requestInput: {
    _id: MATCH3,
    sentByUser_id: BRIAN,
    sentForUser_id: SAMMI,
    receivedByUser_id: UMA,
  },
};

export const SEND_MATCHMAKER_REQUEST_4_VARIABLES = {
  requestInput: {
    _id: MATCH4,
    sentByUser_id: BRIAN,
    sentForUser_id: UMA,
    receivedByUser_id: AVERY,
  },
};

export const SEND_MATCHMAKER_REQUEST_5_VARIABLES = {
  requestInput: {
    _id: MATCH5,
    sentByUser_id: MADE,
    sentForUser_id: AVERY,
    receivedByUser_id: SAMMI,
  },
};

export const SEND_MATCHMAKER_REQUEST_6_VARIABLES = {
  requestInput: {
    _id: MATCH6,
    sentByUser_id: JOSH,
    sentForUser_id: SAMMI,
    receivedByUser_id: BRIAN,
  },
};

export const VIEW_REQUEST_1_VARIABLES = {
  user_id: SAMMI,
  match_id: MATCH1,
};

export const VIEW_REQUEST_2_VARIABLES = {
  user_id: AVERY,
  match_id: MATCH2,
};

export const VIEW_REQUEST_3_1_VARIABLES = {
  user_id: SAMMI,
  match_id: MATCH3,
};

export const VIEW_REQUEST_3_2_VARIABLES = {
  user_id: UMA,
  match_id: MATCH3,
};

export const VIEW_REQUEST_4_1_VARIABLES = {
  user_id: UMA,
  match_id: MATCH4,
};

export const VIEW_REQUEST_4_2_VARIABLES = {
  user_id: AVERY,
  match_id: MATCH4,
};

export const VIEW_REQUEST_5_1_VARIABLES = {
  user_id: AVERY,
  match_id: MATCH5,
};

export const VIEW_REQUEST_5_2_VARIABLES = {
  user_id: SAMMI,
  match_id: MATCH5,
};

export const VIEW_REQUEST_6_1_VARIABLES = {
  user_id: SAMMI,
  match_id: MATCH6,
};

export const ACCEPT_REQUEST_1_VARIABLES = VIEW_REQUEST_1_VARIABLES;

export const REJECT_REQUEST_2_VARIABLES = VIEW_REQUEST_2_VARIABLES;

export const ACCEPT_REQUEST_3_1_VARIABLES = VIEW_REQUEST_3_1_VARIABLES;

export const ACCEPT_REQUEST_3_2_VARIABLES = VIEW_REQUEST_3_2_VARIABLES;

export const ACCEPT_REQUEST_4_1_VARIABLES = VIEW_REQUEST_4_1_VARIABLES;

export const REJECT_REQUEST_4_2_VARIABLES = VIEW_REQUEST_4_2_VARIABLES;

export const REJECT_REQUEST_5_1_VARIABLES = VIEW_REQUEST_5_1_VARIABLES;

export const REJECT_REQUEST_5_2_VARIABLES = VIEW_REQUEST_5_2_VARIABLES;

export const REJECT_REQUEST_6_1_VARIABLES = VIEW_REQUEST_6_1_VARIABLES;

export const UNMATCH_1_VARIABLES = {
  user_id: JOSH,
  match_id: MATCH1,
  reason: 'too many IG followers',
};

export const UNMATCH_2_VARIABLES = {
  user_id: SAMMI,
  match_id: MATCH3,
};
