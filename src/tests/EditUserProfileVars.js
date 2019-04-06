import {
  AVERY_PROFILE_MADE_ID, BRIAN_ID,
  MADE_ID,
  SAMMI_ID,
  SOPHIA_PROFILE_SAMMI_ID, UMA_PROFILE_BRIAN_ID,
} from './TestsContants';

// changes to almost all fields
export const EDIT_AVERY1_USER_PROFILE_VARIABLES = {
  editUserProfileInput: {
    _id: AVERY_PROFILE_MADE_ID,
    creatorUser_id: MADE_ID,
    interests: ['technology', 'pets', 'science'],
    vibes: ['Forbidden Fruit', 'Coco-nuts'],
    bio: 'An all-around incredible dude who built this app!! Is there anything more you can ask for?',
    dos: ['try his delish vodka-strawberry smoothie', 'move too fast'],
    donts: ['be too clingy - sometimes he needs his space!!', 'plan a date for before 1PM'],
  },
};

// minor changes
export const EDIT_UMA1_USER_PROFILE_VARIABLES = {
  editUserProfileInput: {
    _id: UMA_PROFILE_BRIAN_ID,
    creatorUser_id: BRIAN_ID,
    vibes: ['Just Add Water', 'Fruity Cutie'],
    bio: 'This girl has it all: beauty, brains, and of course a resume packed with the hottest tech companies 🤑🤑. She\'s ambitious and brilliant but is also super grounded and a 10/10 caring friend. Catch her while she\'s still single because this deal is LIMITED 👏 TIME 👏 ONLY',
    donts: ['play games', 'be intimidated by her - she won\'t bite!'],
  },
};

// no changes
export const EDIT_SOPHIA1_USER_PROFILE_VARIABLES = {
  editUserProfileInput: {
    _id: SOPHIA_PROFILE_SAMMI_ID,
    creatorUser_id: SAMMI_ID,
    donts: ['watch the bachelor without her', 'put beans in her nachos'],
  },
};
