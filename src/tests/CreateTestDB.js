import {
  CREATE_AVERY_USER_VARIABLES, CREATE_BRIAN_USER_VARIABLES,
  CREATE_JOEL_USER_VARIABLES,
  CREATE_JOSH_USER_VARIABLES, CREATE_MADE_USER_VARIABLES,
  CREATE_SAMMI_USER_VARIABLES, CREATE_SOPHIA_USER_VARIABLES, CREATE_UMA_USER_VARIABLES,
} from './CreateUserVars';
import {
  CREATE_AVERY1_DETACHED_PROFILE_VARIABLES,
  CREATE_BRIAN1_DETACHED_PROFILE_VARIABLES,
  CREATE_JOSH1_DETACHED_PROFILE_VARIABLES,
  CREATE_MADE1_DETACHED_PROFILE_VARIABLES,
  CREATE_SAMMI1_DETACHED_PROFILE_VARIABLES,
  CREATE_SAMMI2_DETACHED_PROFILE_VARIABLES,
  CREATE_SOPHIA1_DETACHED_PROFILE_VARIABLES,
  CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES,
  CREATE_UMA1_DETACHED_PROFILE_VARIABLES,
} from './CreateDetachedProfileVars';
import {
  ATTACH_AVERY1_PROFILE_VARIABLES,
  ATTACH_BRIAN1_PROFILE_VARIABLES,
  ATTACH_JOSH1_PROFILE_VARIABLES,
  ATTACH_MADE1_PROFILE_VARIABLES,
  ATTACH_SAMMI1_PROFILE_VARIABLES,
  ATTACH_SAMMI2_PROFILE_VARIABLES,
  ATTACH_SOPHIA1_PROFILE_VARIABLES,
  ATTACH_SOPHIA2_PROFILE_VARIABLES,
  ATTACH_UMA1_PROFILE_VARIABLES,
} from './AttachProfileVars';
import {
  ADD_AVERY_PHOTOS_VARIABLES,
  ADD_BRIAN_PHOTOS_VARIABLES,
  ADD_JOSH_PHOTOS_VARIABLES,
  ADD_MADE_PHOTOS_VARIABLES,
  ADD_SAMMI_PHOTOS_VARIABLES, ADD_SOPHIA_PHOTOS_VARIABLES,
  ADD_UMA_PHOTOS_VARIABLES,
} from './UpdatePhotosVars';
import {
  ACCEPT_REQUEST_1_VARIABLES,
  ACCEPT_REQUEST_3_1_VARIABLES,
  ACCEPT_REQUEST_3_2_VARIABLES,
  ACCEPT_REQUEST_4_1_VARIABLES,
  REJECT_REQUEST_2_VARIABLES,
  REJECT_REQUEST_4_2_VARIABLES,
  REJECT_REQUEST_5_1_VARIABLES,
  REJECT_REQUEST_5_2_VARIABLES, REJECT_REQUEST_6_1_VARIABLES,
  SEND_MATCHMAKER_REQUEST_3_VARIABLES,
  SEND_MATCHMAKER_REQUEST_4_VARIABLES,
  SEND_MATCHMAKER_REQUEST_5_VARIABLES,
  SEND_MATCHMAKER_REQUEST_6_VARIABLES,
  SEND_PERSONAL_REQUEST_1_VARIABLES,
  SEND_PERSONAL_REQUEST_2_VARIABLES, UNMATCH_1_VARIABLES, UNMATCH_2_VARIABLES,
} from './MatchActionVars';
import {
  AVERY_UPDATE_FEED,
  BRIAN_UPDATE_FEED,
  JOSH_UPDATE_FEED, MADE_UPDATE_FEED,
  SAMMI_UPDATE_FEED, SOPHIA_UPDATE_FEED, UMA_UPDATE_FEED,
} from './UpdateFeedVars';

export const createUsers = [
  CREATE_AVERY_USER_VARIABLES,
  CREATE_BRIAN_USER_VARIABLES,
  CREATE_JOEL_USER_VARIABLES,
  CREATE_JOSH_USER_VARIABLES,
  CREATE_SAMMI_USER_VARIABLES,
  CREATE_MADE_USER_VARIABLES,
  CREATE_UMA_USER_VARIABLES,
  CREATE_SOPHIA_USER_VARIABLES,
];

export const createDetachedProfiles = [
  CREATE_AVERY1_DETACHED_PROFILE_VARIABLES,
  CREATE_BRIAN1_DETACHED_PROFILE_VARIABLES,
  CREATE_JOSH1_DETACHED_PROFILE_VARIABLES,
  CREATE_SAMMI1_DETACHED_PROFILE_VARIABLES,
  CREATE_SAMMI2_DETACHED_PROFILE_VARIABLES,
  CREATE_MADE1_DETACHED_PROFILE_VARIABLES,
  CREATE_UMA1_DETACHED_PROFILE_VARIABLES,
  CREATE_SOPHIA1_DETACHED_PROFILE_VARIABLES,
  CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES,
];

export const attachProfiles = [
  ATTACH_AVERY1_PROFILE_VARIABLES,
  ATTACH_BRIAN1_PROFILE_VARIABLES,
  ATTACH_JOSH1_PROFILE_VARIABLES,
  ATTACH_SAMMI1_PROFILE_VARIABLES,
  ATTACH_SAMMI2_PROFILE_VARIABLES,
  ATTACH_MADE1_PROFILE_VARIABLES,
  ATTACH_UMA1_PROFILE_VARIABLES,
  ATTACH_SOPHIA1_PROFILE_VARIABLES,
  ATTACH_SOPHIA2_PROFILE_VARIABLES,
];

export const updatePhotos = [
  ADD_AVERY_PHOTOS_VARIABLES,
  ADD_BRIAN_PHOTOS_VARIABLES,
  ADD_JOSH_PHOTOS_VARIABLES,
  ADD_SAMMI_PHOTOS_VARIABLES,
  ADD_MADE_PHOTOS_VARIABLES,
  ADD_UMA_PHOTOS_VARIABLES,
  ADD_SOPHIA_PHOTOS_VARIABLES,
];

export const updateFeeds = [
  AVERY_UPDATE_FEED,
  BRIAN_UPDATE_FEED,
  JOSH_UPDATE_FEED,
  SAMMI_UPDATE_FEED,
  MADE_UPDATE_FEED,
  UMA_UPDATE_FEED,
  SOPHIA_UPDATE_FEED,
];

export const sendPersonalRequests = [
  SEND_PERSONAL_REQUEST_1_VARIABLES,
  SEND_PERSONAL_REQUEST_2_VARIABLES,
];

export const sendMatchmakerRequests = [
  SEND_MATCHMAKER_REQUEST_3_VARIABLES,
  SEND_MATCHMAKER_REQUEST_4_VARIABLES,
  SEND_MATCHMAKER_REQUEST_5_VARIABLES,
  SEND_MATCHMAKER_REQUEST_6_VARIABLES,
];

export const acceptRequests = [
  ACCEPT_REQUEST_1_VARIABLES,
  ACCEPT_REQUEST_3_1_VARIABLES,
  ACCEPT_REQUEST_3_2_VARIABLES,
  ACCEPT_REQUEST_4_1_VARIABLES,
];

export const rejectRequests = [
  REJECT_REQUEST_2_VARIABLES,
  REJECT_REQUEST_4_2_VARIABLES,
  REJECT_REQUEST_5_1_VARIABLES,
  REJECT_REQUEST_5_2_VARIABLES,
  REJECT_REQUEST_6_1_VARIABLES,
];

export const unmatches = [
  UNMATCH_1_VARIABLES,
  UNMATCH_2_VARIABLES,
];
