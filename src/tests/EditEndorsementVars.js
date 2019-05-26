import {
  BRIAN_ID,
  JOSH_ID, QUESTION1_ID, QUESTION2_ID, QUESTION3_ID,
  SAMMI_ID, SAMMI_QR1_ID, SAMMI_QR3_ID, SAMMI_QR4_ID, SAMMI_QR5_ID,
} from './TestsContants';

export const EDIT_SAMMI1_ENDORSEMENT_VARIABLES = {
  editEndorsementInput: {
    endorser_id: JOSH_ID,
    user_id: SAMMI_ID,
    questionResponses: [
      {
        _id: SAMMI_QR1_ID,
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        question_id: QUESTION1_ID,
        question: {
          _id: QUESTION1_ID,
          questionText: 'How did they end up on the cover of Forbes?',
          questionTextWithName: 'How did {{name}} end up on the cover of Forbes?',
          questionType: 'freeResponse',
          suggestedResponses: [],
          tags: [],
        },
        responseBody: 'sammi response 1-1 edit 2',
      },
      {
        _id: SAMMI_QR4_ID,
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        question_id: QUESTION3_ID,
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
        responseBody: 'sammi response 1-2',
      },
    ],
  },
};

export const EDIT_SAMMI2_ENDORSEMENT_VARIABLES = {
  editEndorsementInput: {
    endorser_id: BRIAN_ID,
    user_id: SAMMI_ID,
    questionResponses: [
      {
        _id: SAMMI_QR3_ID,
        author_id: BRIAN_ID,
        question_id: QUESTION2_ID,
        question: {
          _id: QUESTION2_ID,
          questionText: 'What\'s your friend\'s weird flex?',
          questionTextWithName: 'What\'s {{name}}\'s weird flex?',
          questionType: 'freeResponse',
          suggestedResponses: [],
          tags: [],
        },
        authorFirstName: 'Brian',
        responseBody: 'sammi response 2-2 edit 1',
      },
      {
        _id: SAMMI_QR5_ID,
        author_id: JOSH_ID,
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
    ],
  },
};
