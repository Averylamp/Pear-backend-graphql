import {
  AVERY_ID,
  AVERY_PROFILE_MADE_D_ID,
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID,
  JOSH_ID,
  JOSH_PROFILE_SOPHIA_D_ID,
  MADE_ID,
  MADE_PROFILE_JOSH_D_ID, QUESTION1_ID, QUESTION2_ID, QUESTION3_ID,
  SAMMI_ID,
  SAMMI_PROFILE_BRIAN_D_ID,
  SAMMI_PROFILE_JOSH_D_ID,
  SOPHIA_ID,
  SOPHIA_PROFILE_SAMMI_D_ID,
  SOPHIA_PROFILE_UMA_D_ID,
  UMA_ID,
  UMA_PROFILE_BRIAN_D_ID,
} from './TestsContants';

export const ATTACH_AVERY1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: AVERY_ID,
    detachedProfile_id: AVERY_PROFILE_MADE_D_ID,
    creatorUser_id: MADE_ID,
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
    ],
    // non-required
    bio: null,
    dos: [],
    donts: [],
    interests: [],
  },
};

export const ATTACH_BRIAN1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: BRIAN_ID,
    detachedProfile_id: BRIAN_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    bio: {
      author_id: SAMMI_ID,
      authorFirstName: 'Sammi',
      content: 'A very strange mans',
    },
    boasts: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        content: 'he turned MIT into a meme',
      },
    ],
    roasts: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        content: 'The kind of guy who would make a dating app to get a date',
      },
    ],
    questionResponses: [
      {
        author_id: SAMMI_ID,
        authorFirstName: 'Sammi',
        question_id: QUESTION2_ID,
        questionText: 'What\'s your favorite shoe??',
        responseBody: 'crocs',
        hidden: true,
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

export const ATTACH_JOSH1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: JOSH_ID,
    detachedProfile_id: JOSH_PROFILE_SOPHIA_D_ID,
    creatorUser_id: SOPHIA_ID,
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

export const ATTACH_SAMMI1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: SAMMI_ID,
    detachedProfile_id: SAMMI_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
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

export const ATTACH_SAMMI2_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: SAMMI_ID,
    detachedProfile_id: SAMMI_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
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

export const ATTACH_MADE1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: MADE_ID,
    detachedProfile_id: MADE_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
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

export const ATTACH_UMA1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: UMA_ID,
    detachedProfile_id: UMA_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    boasts: [
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Uma',
        content: 'Gyms religiously',
      },

    ],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const ATTACH_SOPHIA1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: SOPHIA_ID,
    detachedProfile_id: SOPHIA_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
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

export const ATTACH_SOPHIA2_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: SOPHIA_ID,
    detachedProfile_id: SOPHIA_PROFILE_UMA_D_ID,
    creatorUser_id: UMA_ID,
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
