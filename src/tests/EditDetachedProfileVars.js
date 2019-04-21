import {
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID, JOSH_ID, SAMMI_BOAST1_ID,
  SAMMI_ID, SAMMI_PROFILE_JOSH_D_ID,
  SOPHIA_PROFILE_UMA_D_ID,
  UMA_ID,
  UMA_PROFILE_BRIAN_D_ID,
} from './TestsContants';
import { FAKE_IMAGE_1, FAKE_IMAGE_2 } from './FakeImages';

// changes to almost all fields, as well as additions
export const EDIT_BRIAN1_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: BRIAN_PROFILE_SAMMI_D_ID,
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
    images: [FAKE_IMAGE_1, FAKE_IMAGE_2],
  },
};

// minor changes: delete a boast
export const EDIT_UMA1_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: UMA_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    boasts: [
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Uma',
        content: 'Gyms religiously',
      },
    ],
    roasts: [],
  },
};

export const EDIT_SAMMI1_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: SAMMI_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    boasts: [
      {
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        content: 'Sammi boast 0',
      },
      {
        _id: SAMMI_BOAST1_ID,
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        content: 'Sammi boast 1',
      },
    ],
  },
};

// no changes
export const EDIT_SOPHIA2_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: SOPHIA_PROFILE_UMA_D_ID,
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
    images: [],
  },
};
