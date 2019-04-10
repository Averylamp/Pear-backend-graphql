import {
  AVERY_ID,
  AVERY_PROFILE_MADE_D_ID,
  AVERY_PROFILE_MADE_ID,
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID,
  BRIAN_PROFILE_SAMMI_ID,
  JOSH_ID,
  JOSH_PROFILE_SOPHIA_D_ID,
  JOSH_PROFILE_SOPHIA_ID,
  MADE_ID,
  MADE_PROFILE_JOSH_D_ID, MADE_PROFILE_JOSH_ID,
  SAMMI_ID,
  SAMMI_PROFILE_BRIAN_D_ID,
  SAMMI_PROFILE_BRIAN_ID,
  SAMMI_PROFILE_JOSH_D_ID,
  SAMMI_PROFILE_JOSH_ID,
  SOPHIA_ID,
  SOPHIA_PROFILE_SAMMI_D_ID,
  SOPHIA_PROFILE_SAMMI_ID, SOPHIA_PROFILE_UMA_D_ID, SOPHIA_PROFILE_UMA_ID,
  UMA_ID,
  UMA_PROFILE_BRIAN_D_ID,
  UMA_PROFILE_BRIAN_ID,
} from './TestsContants';

export const ATTACH_AVERY1_PROFILE_VARIABLES = {
  user_id: AVERY_ID,
  detachedProfile_id: AVERY_PROFILE_MADE_D_ID,
  creatorUser_id: MADE_ID,
  userProfile_id: AVERY_PROFILE_MADE_ID,
};

export const ATTACH_BRIAN1_PROFILE_VARIABLES = {
  user_id: BRIAN_ID,
  detachedProfile_id: BRIAN_PROFILE_SAMMI_D_ID,
  creatorUser_id: SAMMI_ID,
  userProfile_id: BRIAN_PROFILE_SAMMI_ID,
};

export const ATTACH_JOSH1_PROFILE_VARIABLES = {
  user_id: JOSH_ID,
  detachedProfile_id: JOSH_PROFILE_SOPHIA_D_ID,
  creatorUser_id: SOPHIA_ID,
  userProfile_id: JOSH_PROFILE_SOPHIA_ID,
};

export const ATTACH_SAMMI1_PROFILE_VARIABLES = {
  user_id: SAMMI_ID,
  detachedProfile_id: SAMMI_PROFILE_JOSH_D_ID,
  creatorUser_id: JOSH_ID,
  userProfile_id: SAMMI_PROFILE_JOSH_ID,
};

export const ATTACH_SAMMI2_PROFILE_VARIABLES = {
  user_id: SAMMI_ID,
  detachedProfile_id: SAMMI_PROFILE_BRIAN_D_ID,
  creatorUser_id: BRIAN_ID,
  userProfile_id: SAMMI_PROFILE_BRIAN_ID,
};

export const ATTACH_MADE1_PROFILE_VARIABLES = {
  user_id: MADE_ID,
  detachedProfile_id: MADE_PROFILE_JOSH_D_ID,
  creatorUser_id: JOSH_ID,
  userProfile_id: MADE_PROFILE_JOSH_ID,
};

export const ATTACH_UMA1_PROFILE_VARIABLES = {
  user_id: UMA_ID,
  detachedProfile_id: UMA_PROFILE_BRIAN_D_ID,
  creatorUser_id: BRIAN_ID,
  userProfile_id: UMA_PROFILE_BRIAN_ID,
};

export const ATTACH_SOPHIA1_PROFILE_VARIABLES = {
  user_id: SOPHIA_ID,
  detachedProfile_id: SOPHIA_PROFILE_SAMMI_D_ID,
  creatorUser_id: SAMMI_ID,
  userProfile_id: SOPHIA_PROFILE_SAMMI_ID,
};

export const ATTACH_SOPHIA2_PROFILE_VARIABLES = {
  user_id: SOPHIA_ID,
  detachedProfile_id: SOPHIA_PROFILE_UMA_D_ID,
  creatorUser_id: UMA_ID,
  userProfile_id: SOPHIA_PROFILE_UMA_ID,
};
