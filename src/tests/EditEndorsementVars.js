import {
  BRIAN_ID,
  JOSH_ID,
  SAMMI_BOAST1_ID, SAMMI_BOAST2_ID,
  SAMMI_ID, SOPHIA_ID, UMA_ID,
} from './TestsContants';

export const EDIT_BRIAN1_ENDORSEMENT_VARIABLES = {
  editEndorsementInput: {
    endorser_id: SAMMI_ID,
    user_id: BRIAN_ID,
    bio: {
      author_id: SAMMI_ID,
      authorFirstName: 'Sammi',
      content: 'He sells a lot of tshirts',
    },
  },
};

export const EDIT_SAMMI1_ENDORSEMENT_VARIABLES = {
  editEndorsementInput: {
    endorser_id: JOSH_ID,
    user_id: SAMMI_ID,
    boasts: [
      {
        _id: SAMMI_BOAST1_ID,
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        content: 'Sammi boast 1 EDITED',
      },
      {
        _id: SAMMI_BOAST2_ID,
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        content: 'Sammi boast 2',
      },
      {
        author_id: JOSH_ID,
        authorFirstName: 'Josh',
        content: 'Sammi boast 4',
      },
    ],
  },
};

export const EDIT_SOPHIA2_ENDORSEMENT_VARIABLES = {
  editEndorsementInput: {
    endorser_id: UMA_ID,
    user_id: SOPHIA_ID,
    bio: {
      author_id: UMA_ID,
      authorFirstName: 'Uma',
      content: 'She loves to dance!!',
    },
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
    ],
  },
};
