import {
  JOSH_ID, QUESTION1_ID,
  SAMMI_PROFILE_JOSH_D_ID, SAMMI_QR1_ID,
} from './TestsContants';

export const EDIT_SAMMI1_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: SAMMI_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
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
        responseBody: 'sammi response 1-1 edit 1',
      },
    ],
  },
};
