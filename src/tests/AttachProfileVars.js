import {
  AVERY_ID,
  AVERY_PROFILE_MADE_D_ID,
  BRIAN_ID,
  BRIAN_PROFILE_SAMMI_D_ID,
  JOSH_ID,
  JOSH_PROFILE_SOPHIA_D_ID,
  MADE_ID,
  MADE_PROFILE_JOSH_D_ID,
  QUESTION1_ID,
  QUESTION2_ID,
  QUESTION3_ID,
  SAMMI_BOAST1_ID,
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
        question: {
          _id: QUESTION1_ID,
          questionText: 'How did they end up on the cover of Forbes?',
          questionTextWithName: 'How did {{name}} end up on the cover of Forbes?',
          questionType: 'multipleChoiceWithOther',
          suggestedResponses: [
            {
              responseBody: 'Because they\'re a "self-made" billionaire',
            },
            {
              responseBody: 'Because they actually deserved it 😍',
            },
            {
              responseBody: 'They made #30Under30, except it\'s because they ate 30 chicken nuggets in under 30 seconds',
            },
            {
              responseBody: 'Got busted for money laundering 🤷\u200d♂️',
            },
          ],
          tags: [
            'personality',
          ],
        },
        responseBody: 'Because they actually deserved it 😍',
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
        question: {
          _id: QUESTION2_ID,
          questionText: 'What\'s your friend\'s weird flex?',
          questionTextWithName: 'What\'s {{name}}\'s weird flex?',
          questionType: 'multipleChoiceWithOther',
          suggestedResponses: [
            {
              responseBody: 'Does homework drunk, still gets A\'s',
            },
            {
              responseBody: '5.0 uber rating',
            },
            {
              responseBody: 'Barry’s Bootcamp/SoulCycle/Orange Theory is an essential part of their morning routine',
            },
            {
              responseBody: 'Fluent in vines',
            },
            {
              responseBody: 'The best relationship advice giver even though they’ve been single af since the womb',
            },
          ],
          tags: [
            'personality',
          ],
        },
        responseBody: '5.0 uber rating',
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
        question: {
          _id: QUESTION3_ID,
          questionText: 'People only want one thing, and it’s disgusting 😫. What does your friend want?',
          questionTextWithName: 'People only want one thing, and it’s disgusting 😫. What does {{name}} want?',
          questionType: 'multipleChoiceWithOther',
          suggestedResponses: [
            {
              responseBody: '"Hey, can you endorse me on LinkedIn?"',
            },
            {
              responseBody: '🍆🍑',
            },
            {
              responseBody: 'To get married by 26, have kids by 30, and become the soccer parent of their dreams',
            },
            {
              responseBody: '"Do you have a minute to talk about our Lord and Savior?" ⛪️🙏',
            },
            {
              responseBody: '💸💸To secure the bag and get that MF BREAD 💰🤑💰',
            },
            {
              responseBody: 'To meet new people, make friends, and be the social butterfly they already are 😇🦋',
            },
          ],
          tags: [
            'personality',
          ],
        },
        responseBody: '"Hey, can you endorse me on LinkedIn?"',
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
        question: {
          _id: QUESTION1_ID,
          questionText: 'How did they end up on the cover of Forbes?',
          questionTextWithName: 'How did {{name}} end up on the cover of Forbes?',
          questionType: 'multipleChoiceWithOther',
          suggestedResponses: [
            {
              responseBody: 'Because they\'re a "self-made" billionaire',
            },
            {
              responseBody: 'Because they actually deserved it 😍',
            },
            {
              responseBody: 'They made #30Under30, except it\'s because they ate 30 chicken nuggets in under 30 seconds',
            },
            {
              responseBody: 'Got busted for money laundering 🤷\u200d♂️',
            },
          ],
          tags: [
            'personality',
          ],
        },
        responseBody: 'They made #30Under30, except it\'s because they ate 30 chicken nuggets in under 30 seconds',
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
        question: {
          _id: QUESTION1_ID,
          questionText: 'How did they end up on the cover of Forbes?',
          questionTextWithName: 'How did {{name}} end up on the cover of Forbes?',
          questionType: 'multipleChoiceWithOther',
          suggestedResponses: [
            {
              responseBody: 'Because they\'re a "self-made" billionaire',
            },
            {
              responseBody: 'Because they actually deserved it 😍',
            },
            {
              responseBody: 'They made #30Under30, except it\'s because they ate 30 chicken nuggets in under 30 seconds',
            },
            {
              responseBody: 'Got busted for money laundering 🤷\u200d♂️',
            },
          ],
          tags: [
            'personality',
          ],
        },
        responseBody: 'Got busted for money laundering 🤷\u200d♂️',
      },
      {
        author_id: BRIAN_ID,
        authorFirstName: 'Brian',
        question_id: QUESTION2_ID,
        question: {
          _id: QUESTION2_ID,
          questionText: 'What\'s your friend\'s weird flex?',
          questionTextWithName: 'What\'s {{name}}\'s weird flex?',
          questionType: 'multipleChoiceWithOther',
          suggestedResponses: [
            {
              responseBody: 'Does homework drunk, still gets A\'s',
            },
            {
              responseBody: '5.0 uber rating',
            },
            {
              responseBody: 'Barry’s Bootcamp/SoulCycle/Orange Theory is an essential part of their morning routine',
            },
            {
              responseBody: 'Fluent in vines',
            },
            {
              responseBody: 'The best relationship advice giver even though they’ve been single af since the womb',
            },
          ],
          tags: [
            'personality',
          ],
        },
        responseBody: 'Fluent in vines',
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
