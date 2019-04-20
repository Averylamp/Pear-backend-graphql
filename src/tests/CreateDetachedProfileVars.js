import {
  AVERY_PROFILE_MADE_D_ID,
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID,
  JOSH_ID,
  JOSH_PROFILE_SOPHIA_D_ID,
  MADE_ID,
  MADE_PROFILE_JOSH_D_ID,
  QUESTION1_ID,
  QUESTION2_ID,
  QUESTION3_ID,
  SAMMI_ID,
  SAMMI_PROFILE_BRIAN_D_ID,
  SAMMI_PROFILE_JOSH_D_ID,
  SOPHIA_ID,
  SOPHIA_PROFILE_SAMMI_D_ID,
  SOPHIA_PROFILE_UMA_D_ID,
  UMA_ID,
  UMA_PROFILE_BRIAN_D_ID,
} from './TestsContants';
import { ADD_QUESTIONS_VARIABLES } from './TestQuestions';

export const CREATE_AVERY1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: AVERY_PROFILE_MADE_D_ID,
    creatorUser_id: MADE_ID,
    creatorFirstName: 'Made',
    firstName: 'Avery',
    phoneNumber: '9738738225',
    boasts: [
      {
        author_id: MADE_ID,
        authorFirstName: 'Made',
        content: 'Makes amazing pesto',
      },
    ],
    roasts: [],
    questionResponses: [
      {
        author_id: MADE_ID,
        authorFirstName: 'Made',
        question_id: QUESTION1_ID,
        questionText: 'What\'s your favorite color?',
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
      },
    ],
    vibes: [
      {
        author_id: MADE_ID,
        authorFirstName: 'Made',
        content: 'Fruity Cutie',
      },
      {
        author_id: MADE_ID,
        authorFirstName: 'Made',
        content: 'Just Add Water',
      },
    ],
  },
};

export const CREATE_BRIAN1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: BRIAN_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    creatorFirstName: 'Sammi',
    firstName: 'Brian',
    phoneNumber: '2067789236',
    boasts: [],
    roasts: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        content: 'The kind of guy who would make a dating app',
      },
    ],
    questionResponses: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        question_id: QUESTION2_ID,
        questionText: 'What\'s your favorite shoe??',
        responseBody: 'crocs',
      },
    ],
    vibes: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        content: 'Extra Like Guac',
      },
    ],
  },
};

export const CREATE_JOSH1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: JOSH_PROFILE_SOPHIA_D_ID,
    creatorUser_id: SOPHIA_ID,
    creatorFirstName: 'Sophia',
    firstName: 'Josh',
    phoneNumber: '7897897898',
    boasts: [
      {
        author_id: SOPHIA_ID,
        authorFirstName: 'Sophia',
        content: 'IG Clout King',
      },
    ],
    roasts: [],
    questionResponses: [
      {
        author_id: SOPHIA_ID,
        authorFirstName: 'Made',
        question_id: QUESTION3_ID,
        questionText: 'What\'s your weird flex?',
        responseBody: 'he\'s a RALPH POLO LAUREN campus ambassador so hit him up for free shirts',
      },
    ],
    vibes: [
      {
        author_id: SOPHIA_ID,
        authorFirstName: 'Sophia',
        content: 'Kiki Kiwi',
      },
      {
        author_id: SOPHIA_ID,
        authorFirstName: 'Sophia',
        content: 'Zesty',
      },
    ],
  },
};

export const CREATE_SAMMI1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SAMMI_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    creatorFirstName: 'Josh',
    firstName: 'Sammi',
    phoneNumber: '9788733736',
    boasts: [],
    roasts: [
      {
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        content: 'Red as a tomato after one drink',
      },
    ],
    questionResponses: [
      {
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        question_id: QUESTION1_ID,
        questionText: 'What\'s your favorite color?',
        responseBody: 'blue',
      },
    ],
    vibes: [],
  },
};

export const CREATE_SAMMI2_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SAMMI_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    creatorFirstName: 'Brian',
    firstName: 'Sammi',
    phoneNumber: '9788733736',
    boasts: [
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Brian',
        content: 'MIT girl who u can trust to make you the Big Bux',
      },
    ],
    roasts: [],
    questionResponses: [
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Brian',
        question_id: QUESTION1_ID,
        questionText: 'What\'s your favorite color?',
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
      },
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Brian',
        question_id: QUESTION2_ID,
        questionText: 'What\'s your favorite shoe??',
        responseBody: 'yeezys',
      },
    ],
    vibes: [],
  },
};

export const CREATE_MADE1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: MADE_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    creatorFirstName: 'Josh',
    firstName: 'Made',
    phoneNumber: '6092402838',
    boasts: [],
    roasts: [
      {
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        content: 'if you hang out with her she will feed you 10000 snacks',
      },
    ],
    questionResponses: [],
    vibes: [],
  },
};

export const CREATE_UMA1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: UMA_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    creatorFirstName: 'Brian',
    firstName: 'Uma',
    phoneNumber: '9784296614',
    boasts: [
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Uma',
        content: 'Gyms religiously',
      },
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Brian',
        content: 'Casually gets onsite tech interviews when she wants to visit the Bay',
      },

    ],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const CREATE_SOPHIA1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SOPHIA_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    creatorFirstName: 'Sammi',
    firstName: 'Sophia',
    phoneNumber: '9165189165',
    boasts: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        content: 'dance queen',
      },
    ],
    roasts: [],
    questionResponses: [],
    vibes: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        content: 'BANANAS',
      },
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        content: 'Coco-NUTS',
      },
    ],
  },
};

export const CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SOPHIA_PROFILE_UMA_D_ID,
    creatorUser_id: UMA_ID,
    creatorFirstName: 'Uma',
    firstName: 'Sophia',
    phoneNumber: '9165189165',
    boasts: [
      {
        author_id: UMA_ID,
        authorFirstName: 'Uma',
        content: 'This girl can juggle!!',
      },
    ],
    roasts: [
      {
        author_id: UMA_ID,
        authorFirstName: 'Uma',
        content: 'Likes sleep more than she\'ll like you',
      },
    ],
    questionResponses: [],
    vibes: [
      {
        author_id: UMA_ID,
        authorFirstName: 'Uma',
        content: 'Zesty',
      },
      {
        author_id: UMA_ID,
        authorFirstName: 'Uma',
        content: 'BANANAS',
      },
      {
        author_id: UMA_ID,
        authorFirstName: 'Uma',
        content: 'Spicy',
      },
    ],
  },
};
