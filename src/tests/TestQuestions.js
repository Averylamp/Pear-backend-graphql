import { QUESTION1_ID, QUESTION2_ID, QUESTION3_ID } from './TestsContants';

export const ADD_QUESTIONS_VARIABLES = {
  newQuestions: [
    {
      _id: QUESTION1_ID,
      questionText: 'What\'s your favorite color?',
      questionTextWithName: 'What\'s your favorite color, *name*?',
      questionType: 'multipleChoice',
      suggestedResponses: [{
        responseBody: 'blue',
      }, {
        responseBody: 'red',
        responseTitle: 'red is a great color',
        color: {
          red: 1.0,
          green: 0.0,
          blue: 0.0,
          alpha: 1.0,
        },
        icon: {
          assetString: 'red-icon',
        },
      }],
    },
    {
      _id: QUESTION2_ID,
      questionText: 'What\'s your favorite shoe??',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [{
        responseBody: 'yeezys',
      }, {
        responseBody: 'crocs',
      }],
    },
    {
      _id: QUESTION3_ID,
      questionText: 'What\'s your weird flex?',
      questionType: 'freeResponse',
      suggestedResponses: [],
    },
  ],
};
