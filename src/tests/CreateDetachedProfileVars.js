import {
  AVERY_PROFILE_MADE_D_ID,
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID, JOEL_PROFILE_BRIAN_D_ID,
  JOSH_ID,
  JOSH_PROFILE_SOPHIA_D_ID,
  MADE_ID,
  MADE_PROFILE_JOSH_D_ID,
  QUESTION1_ID,
  QUESTION2_ID,
  QUESTION3_ID,
  SAMMI_ID,
  SAMMI_PROFILE_BRIAN_D_ID,
  SAMMI_PROFILE_JOSH_D_ID, SAMMI_QR1_ID, SAMMI_QR2_ID, SAMMI_QR3_ID,
  SOPHIA_ID,
  SOPHIA_PROFILE_SAMMI_D_ID,
  SOPHIA_PROFILE_UMA_D_ID,
  UMA_ID,
  UMA_PROFILE_BRIAN_D_ID,
} from './TestsContants';

export const CREATE_AVERY1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: AVERY_PROFILE_MADE_D_ID,
    creatorUser_id: MADE_ID,
    creatorFirstName: '',
    firstName: 'Avery',
    lastName: 'Lamp',
    gender: 'male',
    phoneNumber: '9738738225',
    boasts: [],
    roasts: [],
    questionResponses: [
      {
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
    ],
    vibes: [],
  },
};

export const CREATE_BRIAN1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: BRIAN_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    creatorFirstName: '',
    firstName: 'Brian',
    phoneNumber: '2067789236',
    boasts: [],
    roasts: [],
    questionResponses: [
      {
        author_id: SAMMI_ID,
        authorFirstName: '',
        question_id: QUESTION2_ID,
        question: {
          _id: QUESTION2_ID,
          questionText: 'What\'s your friend\'s weird flex?',
          questionTextWithName: 'What\'s {{name}}\'s weird flex?',
          questionType: 'freeResponse',
          suggestedResponses: [],
          tags: [
            'personality',
          ],
        },
        responseBody: 'brian response 1-1',
      },
    ],
    vibes: [],
  },
};

export const CREATE_JOSH1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: JOSH_PROFILE_SOPHIA_D_ID,
    creatorUser_id: SOPHIA_ID,
    creatorFirstName: '',
    firstName: 'Josh',
    gender: 'male',
    phoneNumber: '7897897898',
    questionResponses: [
      {
        author_id: SOPHIA_ID,
        authorFirstName: '',
        question_id: QUESTION3_ID,
        question: {
          _id: QUESTION3_ID,
          questionText: 'People only want one thing, and it’s disgusting 😫. What does your friend want?',
          questionTextWithName: 'People only want one thing, and it’s disgusting 😫. What does {{name}} want?',
          questionType: 'freeResponse',
          suggestedResponses: [],
          tags: [],
        },
        responseBody: 'josh response 1-1',
      },
    ],
  },
};

export const CREATE_SAMMI1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SAMMI_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    creatorFirstName: '',
    firstName: 'Sammi',
    phoneNumber: '9788733736',
    gender: 'female',
    questionResponses: [
      {
        _id: SAMMI_QR1_ID,
        author_id: JOSH_ID,
        authorFirstName: '',
        question_id: QUESTION1_ID,
        question: {
          _id: QUESTION1_ID,
          questionText: 'How did they end up on the cover of Forbes?',
          questionTextWithName: 'How did {{name}} end up on the cover of Forbes?',
          questionType: 'freeResponse',
          suggestedResponses: [],
          tags: [],
        },
        responseBody: 'sammi response 1-1',
      },
    ],
  },
};

export const CREATE_SAMMI2_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SAMMI_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    creatorFirstName: '',
    firstName: 'Sammi',
    phoneNumber: '9788733736',
    questionResponses: [
      {
        _id: SAMMI_QR2_ID,
        author_id: BRIAN_ID,
        authorFirstName: '',
        question_id: QUESTION1_ID,
        question: {
          _id: QUESTION1_ID,
          questionText: 'How did they end up on the cover of Forbes?',
          questionTextWithName: 'How did {{name}} end up on the cover of Forbes?',
          questionType: 'freeResponse',
          suggestedResponses: [],
          tags: [],
        },
        responseBody: 'sammi response 2-1',
      },
      {
        _id: SAMMI_QR3_ID,
        author_id: BRIAN_ID,
        authorFirstName: '',
        question_id: QUESTION2_ID,
        question: {
          _id: QUESTION2_ID,
          questionText: 'What\'s your friend\'s weird flex?',
          questionTextWithName: 'What\'s {{name}}\'s weird flex?',
          questionType: 'freeResponse',
          suggestedResponses: [],
          tags: [],
        },
        responseBody: 'sammi response 2-2',
      },
    ],
  },
};

export const CREATE_MADE1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: MADE_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    creatorFirstName: '',
    firstName: 'Made',
    phoneNumber: '6092402838',
    questionResponses: [],
  },
};

export const CREATE_UMA1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: UMA_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    creatorFirstName: '',
    firstName: 'Uma',
    phoneNumber: '9784296614',
    questionResponses: [],
  },
};

export const CREATE_SOPHIA1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SOPHIA_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    creatorFirstName: '',
    firstName: 'Sophia',
    phoneNumber: '9165189165',
    questionResponses: [],
  },
};

export const CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SOPHIA_PROFILE_UMA_D_ID,
    creatorUser_id: UMA_ID,
    creatorFirstName: '',
    firstName: 'Sophia',
    phoneNumber: '9165189165',
    questionResponses: [],
  },
};

export const CREATE_JOEL1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: JOEL_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    creatorFirstName: 'Brian',
    firstName: 'Joel',
    phoneNumber: '7777777777',
    questionResponses: [],
  },
};
