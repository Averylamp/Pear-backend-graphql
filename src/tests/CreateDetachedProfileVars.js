import {
  AVERY_PROFILE_MADE_D_ID, BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID, JOSH_ID,
  JOSH_PROFILE_SOPHIA_D_ID, MADE_ID,
  MADE_PROFILE_JOSH_D_ID, SAMMI_ID, SAMMI_PROFILE_BRIAN_D_ID,
  SAMMI_PROFILE_JOSH_D_ID, SOPHIA_ID,
  SOPHIA_PROFILE_SAMMI_D_ID, SOPHIA_PROFILE_UMA_D_ID, UMA_ID, UMA_PROFILE_BRIAN_D_ID,
} from './TestsContants';

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
    questionResponses: [],
    vibes: [],
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
    questionResponses: [],
    vibes: [],
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
    questionResponses: [],
    vibes: [],
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
    questionResponses: [],
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
    questionResponses: [],
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
    vibes: [],
  },
};

export const CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SOPHIA_PROFILE_UMA_D_ID,
    creatorUser_id: UMA_ID,
    creatorFirstName: 'Uma',
    firstName: 'Sophia',
    phoneNumber: '9165189165',
    boasts: [],
    roasts: [
      {
        author_id: UMA_ID,
        authorFirstName: 'Uma',
        content: 'Likes sleep more than she\'ll like you',
      },
    ],
    questionResponses: [],
    vibes: [],
  },
};
