import {
  AVERY_ID, BRIAN_ID, JOSH_ID, SAMMI_ID, SOPHIA_ID, UMA_ID, MADE_ID,
  MATCH1_ID, MATCH2_ID, MATCH3_ID, MATCH4_ID, MATCH5_ID, MATCH6_ID,
} from './TestsContants';

export const SEND_PERSONAL_REQUEST_1_VARIABLES = {
  requestInput: {
    _id: MATCH1_ID,
    sentByUser_id: JOSH_ID,
    sentForUser_id: JOSH_ID,
    receivedByUser_id: SAMMI_ID,
  },
};

export const SEND_PERSONAL_REQUEST_2_VARIABLES = {
  requestInput: {
    _id: MATCH2_ID,
    sentByUser_id: SOPHIA_ID,
    sentForUser_id: SOPHIA_ID,
    receivedByUser_id: AVERY_ID,
  },
};

export const SEND_MATCHMAKER_REQUEST_3_VARIABLES = {
  requestInput: {
    _id: MATCH3_ID,
    sentByUser_id: BRIAN_ID,
    sentForUser_id: SAMMI_ID,
    receivedByUser_id: UMA_ID,
  },
};

export const SEND_MATCHMAKER_REQUEST_4_VARIABLES = {
  requestInput: {
    _id: MATCH4_ID,
    sentByUser_id: BRIAN_ID,
    sentForUser_id: UMA_ID,
    receivedByUser_id: AVERY_ID,
  },
};

export const SEND_MATCHMAKER_REQUEST_5_VARIABLES = {
  requestInput: {
    _id: MATCH5_ID,
    sentByUser_id: MADE_ID,
    sentForUser_id: AVERY_ID,
    receivedByUser_id: SAMMI_ID,
  },
};

export const SEND_MATCHMAKER_REQUEST_6_VARIABLES = {
  requestInput: {
    _id: MATCH6_ID,
    sentByUser_id: JOSH_ID,
    sentForUser_id: SAMMI_ID,
    receivedByUser_id: BRIAN_ID,
  },
};

export const ACCEPT_REQUEST_1_VARIABLES = {
  user_id: SAMMI_ID,
  match_id: MATCH1_ID,
};

export const REJECT_REQUEST_2_VARIABLES = {
  user_id: AVERY_ID,
  match_id: MATCH2_ID,
};

export const ACCEPT_REQUEST_3_1_VARIABLES = {
  user_id: SAMMI_ID,
  match_id: MATCH3_ID,
};

export const ACCEPT_REQUEST_3_2_VARIABLES = {
  user_id: UMA_ID,
  match_id: MATCH3_ID,
};

export const ACCEPT_REQUEST_4_1_VARIABLES = {
  user_id: UMA_ID,
  match_id: MATCH4_ID,
};

export const REJECT_REQUEST_4_2_VARIABLES = {
  user_id: AVERY_ID,
  match_id: MATCH4_ID,
};

export const REJECT_REQUEST_5_1_VARIABLES = {
  user_id: AVERY_ID,
  match_id: MATCH5_ID,
};

export const REJECT_REQUEST_5_2_VARIABLES = {
  user_id: SAMMI_ID,
  match_id: MATCH5_ID,
};

export const REJECT_REQUEST_6_1_VARIABLES = {
  user_id: SAMMI_ID,
  match_id: MATCH6_ID,
};

// request 6 is not acted on by the second person

export const UNMATCH_1_VARIABLES = {
  user_id: JOSH_ID,
  match_id: MATCH1_ID,
  reason: 'too many IG followers',
};

export const UNMATCH_2_VARIABLES = {
  user_id: SAMMI_ID,
  match_id: MATCH3_ID,
};
