import {
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID,
  SAMMI_ID,
  SOPHIA_PROFILE_UMA_D_ID,
  UMA_ID,
  UMA_PROFILE_BRIAN_D_ID,
} from './TestsContants';
import { FAKE_IMAGE_1, FAKE_IMAGE_2 } from './FakeImages';

// changes to almost all fields
export const EDIT_BRIAN1_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: BRIAN_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    interests: ['music', 'concerts', 'technology', 'dance'],
    bio: 'New bio: short test bio',
    dos: ['be direct (he hates guessing)', 'ask him about Mass Tech', 'go out for any Asian food!'],
    donts: ['try to get him to wake up early'],
    images: [FAKE_IMAGE_1, FAKE_IMAGE_2],
  },
};

// minor changes
export const EDIT_UMA1_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: UMA_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    interests: ['coding'],
    vibes: ['Forbidden Fruit', 'Spicy'],
    bio: 'Test bio that shouln\'t appear if edit user profiles is called',
  },
};

// no changes
export const EDIT_SOPHIA2_DETACHED_PROFILE_VARIABLES = {
  editDetachedProfileInput: {
    _id: SOPHIA_PROFILE_UMA_D_ID,
    creatorUser_id: UMA_ID,
    interests: ['dance', 'technology', 'art'],
    bio: 'The ONLY person I know that is ALWAYS down for a spontaneous adventure or food run. Sophia embodies the work hard play hard mentality. Harvard PreMed (did someone say moneyyyy) but also fluent in alcohol (rip kidney). Hurry and slide into her dms before someone else does!!',
    dos: [
      'let her know when ur hungry because chances are she is too',
      'have late night deep convos with her because she\'s a great listener and advice-giver'],
    images: [],
  },
};
