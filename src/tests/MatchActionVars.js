import {
  AVERY_ID,
  BRIAN_ID,
  JOSH_ID,
  SAMMI_ID,
  SOPHIA_ID,
  UMA_ID,
  MADE_ID,
  MATCH1_ID,
  MATCH2_ID,
  MATCH3_ID,
  MATCH4_ID,
  MATCH5_ID,
  MATCH6_ID,
  EMPTY_USER_ID1,
  EMPTY_USER_ID2,
  SAMMI_PHOTO2,
  QUESTION1_ID,
  QUESTION2_ID,
  QUESTION3_ID,
  AVERY_PHOTO1,
  SAMMI_QR5_ID,
} from './TestsContants';

export const SEND_PERSONAL_REQUEST_1_VARIABLES = {
  requestInput: {
    _id: MATCH1_ID,
    sentByUser_id: JOSH_ID,
    sentForUser_id: JOSH_ID,
    receivedByUser_id: SAMMI_ID,
    requestText: 'I\'d like to match with you!',
    likedPhoto: SAMMI_PHOTO2,
  },
};

export const SEND_PERSONAL_REQUEST_2_VARIABLES = {
  requestInput: {
    _id: MATCH2_ID,
    sentByUser_id: SOPHIA_ID,
    sentForUser_id: SOPHIA_ID,
    receivedByUser_id: AVERY_ID,
    likedPrompt: {
      author_id: MADE_ID,
      authorFirstName: '',
      question_id: QUESTION1_ID,
      question: {
        _id: QUESTION1_ID,
        questionText: 'How did they end up on the cover of Forbes?',
        questionTextWithName: 'How did {{name}} end up on the cover of Forbes?',
        questionType: 'freeResponse',
        suggestedResponses: [],
        tags: [
          'personality',
        ],
      },
      responseBody: 'avery response 1-1',
    },
  },
};

export const SEND_MATCHMAKER_REQUEST_3_VARIABLES = {
  requestInput: {
    _id: MATCH3_ID,
    sentByUser_id: BRIAN_ID,
    sentForUser_id: SAMMI_ID,
    receivedByUser_id: UMA_ID,
    requestText: 'You two would make a great Pear!',
    likedPrompt: {
      author_id: BRIAN_ID,
      authorFirstName: 'Brian',
      question_id: QUESTION2_ID,
      question: {
        _id: QUESTION2_ID,
        questionText: 'What\'s your friend\'s weird flex?',
        questionTextWithName: 'What\'s {{name}}\'s weird flex?',
        questionType: 'freeResponse',
        suggestedResponses: [],
        tags: [],
      },
      responseBody: 'uma response 1-1',
    },
  },
};

export const SEND_MATCHMAKER_REQUEST_4_VARIABLES = {
  requestInput: {
    _id: MATCH4_ID,
    sentByUser_id: BRIAN_ID,
    sentForUser_id: UMA_ID,
    receivedByUser_id: AVERY_ID,
    likedPhoto: AVERY_PHOTO1,
  },
};

export const SEND_MATCHMAKER_REQUEST_5_VARIABLES = {
  requestInput: {
    _id: MATCH5_ID,
    sentByUser_id: MADE_ID,
    sentForUser_id: AVERY_ID,
    receivedByUser_id: SAMMI_ID,
    likedPrompt: {
      _id: SAMMI_QR5_ID,
      author_id: BRIAN_ID,
      question_id: QUESTION2_ID,
      question: {
        _id: QUESTION3_ID,
        questionText: 'People only want one thing, and it’s disgusting 😫. What does your friend want?',
        questionTextWithName: 'People only want one thing, and it’s disgusting 😫. What does {{name}} want?',
        questionType: 'freeResponse',
        suggestedResponses: [],
        tags: [
          'personality',
        ],
      },
      authorFirstName: 'Brian',
      responseBody: 'sammi response 2-3',
    },
  },
};

export const SEND_MATCHMAKER_REQUEST_6_VARIABLES = {
  requestInput: {
    _id: MATCH6_ID,
    sentByUser_id: JOSH_ID,
    sentForUser_id: SAMMI_ID,
    receivedByUser_id: BRIAN_ID,
    requestText: 'You both love doggos!',
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

export const ACCEPT_REQUEST_4_2_VARIABLES = {
  user_id: AVERY_ID,
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

export const SEND_EMPTY_WAVE0 = {
  requestInput: {
    sentByUser_id: BRIAN_ID,
    sentForUser_id: BRIAN_ID,
    receivedByUser_id: EMPTY_USER_ID1,
  },
};

export const SEND_EMPTY_PEAR0 = {
  requestInput: {
    sentByUser_id: BRIAN_ID,
    sentForUser_id: SAMMI_ID,
    receivedByUser_id: EMPTY_USER_ID2,
  },
};
