import {
  AVERY_ID,
  AVERY_PROFILE_MADE_D_ID,
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID, JOEL_ID, JOEL_PROFILE_BRIAN_D_ID,
  JOSH_ID,
  JOSH_PROFILE_SOPHIA_D_ID,
  MADE_ID,
  MADE_PROFILE_JOSH_D_ID,
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
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
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
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const ATTACH_JOSH1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: JOSH_ID,
    detachedProfile_id: JOSH_PROFILE_SOPHIA_D_ID,
    creatorUser_id: SOPHIA_ID,
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const ATTACH_SAMMI1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: SAMMI_ID,
    detachedProfile_id: SAMMI_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const ATTACH_SAMMI2_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: SAMMI_ID,
    detachedProfile_id: SAMMI_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const ATTACH_MADE1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: MADE_ID,
    detachedProfile_id: MADE_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const ATTACH_UMA1_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: UMA_ID,
    detachedProfile_id: UMA_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    boasts: [],
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
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const ATTACH_SOPHIA2_PROFILE_VARIABLES = {
  approveDetachedProfileInput: {
    user_id: SOPHIA_ID,
    detachedProfile_id: SOPHIA_PROFILE_UMA_D_ID,
    creatorUser_id: UMA_ID,
    boasts: [],
    roasts: [],
    questionResponses: [],
    vibes: [],
  },
};

export const REJECT_JOEL1_PROFILE_VARIABLES = {
  rejectDetachedProfileInput: {
    user_id: JOEL_ID,
    detachedProfile_id: JOEL_PROFILE_BRIAN_D_ID,
  },
};
