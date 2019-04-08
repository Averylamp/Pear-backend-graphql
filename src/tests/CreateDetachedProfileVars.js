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
    age: 21,
    gender: 'male',
    school: 'MIT',
    schoolYear: '2020',
    interests: ['technology', 'coding'],
    vibes: ['Baddest Radish', 'Zesty'],
    bio: 'Want to meet the real forbidden fruit? Attracted to ~ mysterious ~ guys who have multiple ~ layers ~ to them? Well that\'s literally Avery. Avery is also one of the most kind, honest people I\'ve ever met and probably THE BEST cook I\'ve ever met too. If nothing else, it wouldn\'t be a bad idea to marry him just for his pesto...',
    dos: ['ask him about his new dating app', 'ask him to eat ramen with you'],
    donts: ['be too clingy - sometimes he needs his space!!', 'plan a date for before 1PM'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_BRIAN1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: BRIAN_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    creatorFirstName: 'Sammi',
    firstName: 'Brian',
    phoneNumber: '2067789236',
    age: 20,
    gender: 'male',
    school: 'M.I.T.',
    schoolYear: '2020',
    interests: ['music', 'news', 'coding'],
    vibes: ['Just Add Water', 'Extra Like Guac'],
    bio: 'Seeking a guy who will treat you right???? Well look no further than BRIAN GU\nMIT math boi, currently Boston based.\n\nGreatest accomplishments: can outfit you with the thriving apparel line he runs out of his dorm 😎, runs a meme page with 20k+ likes, has a diversity of interests aka frisbee/boulder/tennis/travel.\nCONS: failed out of 6th grade Chinese school, you\'ll have to compete with his stuffed animals for attention',
    dos: ['be direct (he hates guessing)', 'ask him about Mass Tech', 'go out for any Asian food!'],
    donts: ['take him the movies on a first date'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_JOSH1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: JOSH_PROFILE_SOPHIA_D_ID,
    creatorUser_id: SOPHIA_ID,
    creatorFirstName: 'Sophia',
    firstName: 'Josh',
    phoneNumber: '7897897898',
    age: 20,
    gender: 'male',
    school: 'Harvard',
    interests: ['dance', 'news', 'music', 'pets'],
    vibes: ['Fruity Cutie', 'Kiki Kiwi'],
    bio: 'Josh is literally one of the most talented people I’ve ever met. I thought he would peak in high school bc he was SO EXTRA (literally missed homecoming dance even though he was homecoming KING bc he was doing contracted research at Peking University when he was 15). Ask him about back up dancing for Hailee Steinfeld or Janet Jackson/his dance charity that he started in Boston/or his youtube videos that hit millions of views.',
    dos: ['ask him about dance', 'be intellectual (mans loves a good conversation)'],
    donts: ['try to go shot for shot with him (this man won\'t make it past three drinks)'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_SAMMI1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SAMMI_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    creatorFirstName: 'Josh',
    firstName: 'Sammi',
    phoneNumber: '9788733736',
    age: 20,
    gender: 'female',
    interests: ['art', 'illustration', 'fashion', 'writing', 'movies'],
    vibes: ['Extra Like Guac', 'BANANAS'],
    bio: 'Artistic, sensitive, passionate, and also just super hilarious and down to earth. She’s one of those girls that can have a conversation with you about literally anything. She\'s a family oriented person and one of those people that no one can speak poorly of. <3',
    dos: ['CHECK OUT HER ART INSTA @ARTBYSAMMI it\'s 🔥🔥', 'be thoughtful', 'make the first move'],
    donts: ['just be looking for a hookup - she\'s not here for that'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_SAMMI2_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SAMMI_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    creatorFirstName: 'Brian',
    firstName: 'Sammi',
    phoneNumber: '9788733736',
    age: 19,
    gender: 'female',
    interests: ['board games', 'coding', 'fashion', 'art'],
    vibes: ['Fruity Cutie', 'Forbidden Cutie'],
    bio: 'Sammi had e. coli poisoning in the 3rd grade and STILL went to EVERYDAY of class. That’s how much you can depend on her 😭. Now sammi is a SKister (sigma kappa sorority girl ew i know) at MIT where she studies things I don’t understand (computer something beep boop beep).',
    dos: ['ask her about her drawings (she\'s insta famous)', 'put effort into dates!'],
    donts: ['feed her peanuts (she\'s deathly allergic)'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_MADE1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: MADE_PROFILE_JOSH_D_ID,
    creatorUser_id: JOSH_ID,
    creatorFirstName: 'Josh',
    firstName: 'Made',
    phoneNumber: '6092402838',
    age: 20,
    gender: 'female',
    interests: ['coding', 'fashion', 'design', 'makeup', 'vegan'],
    vibes: ['Zesty', 'Extra Like Guac', 'BANANAS'],
    bio: 'She’s one of the most hardworking and passionate people I’ve ever met! Not only is she hot (omg like come on look at her pics), but she is constantly working on side projects on her own (ask her about one of the many apps she’s made, clothing lines she started, her photography page, etc etc etc). We STAN a lady that’s hot, has class, and has brains. If you get inferiority complex and have masculinity issues when next to a boss lady then move on!',
    dos: ['take her out somewhere nice', 'be a gentleman', 'buy her mint oreos, those are her FAVORITE'],
    donts: ['be an asshole or too full of yourself', 'be too forward'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_UMA1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: UMA_PROFILE_BRIAN_D_ID,
    creatorUser_id: BRIAN_ID,
    creatorFirstName: 'Brian',
    firstName: 'Uma',
    phoneNumber: '9784296614',
    age: 21,
    gender: 'female',
    interests: ['coding', 'writing', 'skiing', 'philosophy', 'poetry'],
    vibes: ['Just Add Water', 'Fruity Cutie'],
    bio: 'This girl has it all: beauty, brains, and of course a resume packed with the hottest tech companies 🤑🤑. She\'s ambitious and brilliant but is also super grounded and a 10/10 caring friend. Catch her while she\'s still single because this deal is LIMITED 👏 TIME 👏 ONLY',
    dos: ['be able to hold a conversation', 'tell her about your favorite books', 'go to the gym with her'],
    donts: ['play games', 'be intimidated by her - she won\'t bite!'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_SOPHIA1_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SOPHIA_PROFILE_SAMMI_D_ID,
    creatorUser_id: SAMMI_ID,
    creatorFirstName: 'Sammi',
    firstName: 'Sophia',
    phoneNumber: '9165189165',
    age: 20,
    gender: 'female',
    interests: ['dance', 'technology', 'art'],
    vibes: ['Spicy', 'Fruity Cutie'],
    bio: 'The ONLY person I know that is ALWAYS down for a spontaneous adventure or food run. Sophia embodies the work hard play hard mentality. Harvard PreMed (did someone say moneyyyy) but also fluent in alcohol (rip kidney). Hurry and slide into her dms before someone else does!!',
    dos: ['let her know when ur hungry because chances are she is too', 'have late night deep convos with her because she\'s a great listener and advice-giver'],
    donts: ['watch the bachelor without her', 'put beans in her nachos'],
    location: [-71.101366, 42.362580],
  },
};

export const CREATE_SOPHIA2_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    _id: SOPHIA_PROFILE_UMA_D_ID,
    creatorUser_id: UMA_ID,
    creatorFirstName: 'Uma',
    firstName: 'Sophia',
    phoneNumber: '9165189165',
    age: 20,
    gender: 'female',
    interests: ['dance', 'coding', 'music', 'environment'],
    vibes: ['Zesty', 'BANANAS', 'Spicy'],
    bio: 'Like bad girls? Sophia\'s bad at everything.\n\nExcept watching movies and drinking copious amounts of boba. If you like either of those things, she\'s the one!',
    dos: ['Take her to the movies! she\'s a bit of a movie junkie and loves a good horror flick too, so you won\'t have to give those up.'],
    donts: ['be late to a date! Sophia is the most punctual person I know'],
    location: [-71.101366, 42.362580],
  },
};
