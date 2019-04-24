import { QUESTION1_ID, QUESTION2_ID, QUESTION3_ID } from './TestsContants';

export const ADD_QUESTIONS_VARIABLES = {
  newQuestions: [
    {
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
    {
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
    {
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
    {
      questionText: 'Humble them a little',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Skips leg day: chicken legs 🐓',
        },
        {
          responseBody: 'Instagram game is weak af',
        },
        {
          responseBody: '"Have you ever met someone so academically talented, yet still so dumb?"',
        },
        {
          responseBody: 'Can’t hang 🍁🍺',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'Your friend is going on a first date — what are they drinking?',
      questionTextWithName: '{{name}} is going on a first date - what are they drinking?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseTitle: 'Water',
          responseBody: 'Basic, smh 💦',
        },
        {
          responseTitle: 'Tea',
          responseBody: 'Bad n bougie ☕️',
        },
        {
          responseTitle: 'Boba',
          responseBody: 'Cultered af 🥤',
        },
        {
          responseTitle: 'Fruity cocktail',
          responseBody: 'Fun and flirty 🍓',
        },
        {
          responseTitle: 'Tequila',
          responseBody: 'Trynna fook 💀',
        },
      ],
      tags: [
        'dating',
        'starter',
      ],
    },
    {
      questionText: 'What would they do if there was a zombie apocalypse?',
      questionTextWithName: 'What would {{name}} do if there was a zombie apocalypse?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Purposely get bitten so they don’t have to deal with this shit',
        },
        {
          responseBody: 'Get half of the squad eaten cause they’re so freaking indecisive ️',
        },
        {
          responseBody: 'Force you to stand in front of them at ALL TIMES',
        },
        {
          responseBody: 'Lead the group to safety cause they’re a real one',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'What state describes your friend’s personality the best?',
      questionTextWithName: 'what state describes {{name}}\'s personality the best?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'California: brb, at SoulCycle',
        },
        {
          responseBody: 'New York: unstoppable on the sidewalk️',
        },
        {
          responseBody: 'Texas: yeeHAAW',
        },
        {
          responseBody: 'Florida: something’s not right',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'What part of your friend makes their decisions?',
      questionTextWithName: 'What part of {{name}} makes their decisions?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Their brain',
        },
        {
          responseBody: 'Their heart',
        },
        {
          responseBody: 'Their stomach',
        },
        {
          responseBody: 'Their 🍆',
        },
      ],
      tags: [
        'spicy',
      ],
    },
    {
      questionText: 'If they were a dog, what would they be?',
      questionTextWithName: 'If {{name}} were a dog, what would they be?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseTitle: 'Chihuahua',
          responseBody: 'Cute and angry',
        },
        {
          responseTitle: 'Shiba Inu',
          responseBody: 'Adorable but always sleepy️',
        },
        {
          responseTitle: 'Golden Retriever',
          responseBody: 'Loyal and optimistic',
        },
        {
          responseTitle: 'Pug',
          responseBody: 'Has respiratory problems',
        },
        {
          responseTitle: 'Great Dane',
          responseBody: 'BIG',
        },
      ],
      tags: [
        'starter',
        'personality',
      ],
    },
    {
      questionText: 'What Disney character is your friend?',
      questionTextWithName: 'What Disney character is {{name}}?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseTitle: 'Stitch',
          responseBody: 'They\'re a little freaky',
        },
        {
          responseTitle: 'Beast',
          responseBody: 'It’s what’s inside that counts 🤷\u200d♂️',
        },
        {
          responseTitle: 'Elsa',
          responseBody: 'They’re lowkey ice cold, but like… they still love you? ❄️',
        },
        {
          responseTitle: 'Genie',
          responseBody: 'Just gotta rub them the right way 😉',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'What\'s their ideal time for a first date?',
      questionTextWithName: 'What\'s {{name}}\'s ideal time for a first date\'?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseTitle: '8am',
          responseBody: 'Early bird gets the worm 😉',
        },
        {
          responseTitle: '11am',
          responseBody: 'Snapshot story brunch️',
        },
        {
          responseTitle: '3pm',
          responseBody: 'Casual coffee️',
        },
        {
          responseTitle: '6pm',
          responseBody: 'Classy dinner',
        },
        {
          responseTitle: '1am',
          responseBody: 'hey u up? 😩',
        },
      ],
      tags: [
        'dating',
        'starter',
      ],
    },
    {
      questionText: 'Which budget-sensitive mid-size 2004 Toyota sedan is your friend?',
      questionTextWithName: 'Which budget-sensitive mid-size 2004 Toyota sedan is {{name}}?',
      questionType: 'multipleChoice',
      suggestedResponses: [
        {
          responseTitle: '2004 Toyota Avalon',
          responseBody: 'The one who\'s got it all figured out',
        },
        {
          responseTitle: '2004 Toyota Camry',
          responseBody: 'Financially-savvy and fuel-efficient️',
        },
        {
          responseTitle: '2004 Toyota Camry Solara',
          responseBody: 'The lesser-known younger sibling',
        },
        {
          responseTitle: '2004 Toyota Highlander',
          responseBody: 'Sturdy and dependable',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'What did your friend teach Ariana in "thank u, next?"',
      questionTextWithName: 'What did {{name}} teach Ariana in "thank u, next?"',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Love',
        },
        {
          responseBody: 'Patience',
        },
        {
          responseBody: 'Pain',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'Which Michael Scott alter-ego from The Office are they?',
      questionTextWithName: 'Which Michael Scott alter-ego from The Office is {{name}}?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Prison Mike',
        },
        {
          responseBody: 'Date Mike',
        },
        {
          responseBody: 'Michael Scarn',
        },
        {
          responseBody: 'Dwight',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'What type of jacket are they?',
      questionTextWithName: 'What type of jacket is {{name}}?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'North Face',
        },
        {
          responseBody: 'cAnADa gOOsE',
        },
        {
          responseBody: 'Dad\'s old jacket',
        },
        {
          responseBody: 'Moncler (we get it, you\'re international)',
        },
        {
          responseBody: 'What\'s a jacket?',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'You lost your friend at the club. What are they doing?',
      questionTextWithName: 'You lost {{name}} at the club. What are they doing?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Throwing it back on the dance floor',
        },
        {
          responseBody: '🤮 in the bathroom',
        },
        {
          responseBody: 'Flirting for free drinks',
        },
        {
          responseBody: 'Already left with someone',
        },
        {
          responseBody: 'On an elevated surface',
        },
        {
          responseBody: 'Scheming',
        },
      ],
      tags: [
        'personality',
        'starter',
      ],
    },
    {
      questionText: 'What\'s their go-to shoe?',
      questionTextWithName: 'What\'s {{name}}\'s go-to shoe?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Crocs',
        },
        {
          responseBody: 'Yeezys (hypebeast smh)',
        },
        {
          responseBody: 'Birkenstocks',
        },
        {
          responseBody: 'Sketchers shape-ups',
        },
        {
          responseBody: 'They cut up their Gucci shoes to attach the pieces to their Balenciaga slides',
        },
        {
          responseBody: 'Barefoot (they like to let their toes breathe)',
        },
      ],
      tags: [
        'personality',
      ],
    },
    {
      questionText: 'Why are they still single?',
      questionTextWithName: 'Why is {{name}} still single?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Their standards are too damn high',
        },
        {
          responseBody: 'Pre-med/pre-law etc. (lol)',
        },
        {
          responseBody: 'MONOGAMY IS A LIE',
        },
        {
          responseBody: 'They only attract the worst type of people',
        },
      ],
      tags: [
        'dating',
      ],
    },
    {
      questionText: 'What is definitely on their sex playlist?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'Classical music, nothing gets them going like a good Debussy (¿Depussy?)',
        },
        {
          responseBody: '2010 Justin Bieber',
        },
        {
          responseBody: 'Heavy Metal',
        },
        {
          responseBody: 'Rihanna\'s "S&M"',
        },
        {
          responseBody: 'Saving it for The One 😇',
        },
      ],
      tags: [
        'spicy',
      ],
    },
    {
      questionText: 'What Taylor Swift song describes their love life?',
      questionTextWithName: 'What Taylor Swift song describes {{name}}\'s love life?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: '"We Are Never Ever Getting Back Together"',
        },
        {
          responseBody: '"Love Story"',
        },
        {
          responseBody: '"I Knew You Were Trouble"',
        },
        {
          responseBody: '"...Ready For It?"',
        },
        {
          responseBody: '"Picture To Burn"',
        },
      ],
      tags: [
        'dating',
        'starter',
      ],
    },
    {
      questionText: 'What overused dating app trope are they?',
      questionTextWithName: 'What overused dating app trope is {{name}}?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: '"Looking for the Jim to my Pam"/"Looking for the Pam to my Jim"',
        },
        {
          responseBody: '"LOVE doggos 😍😍"',
        },
        {
          responseBody: '"Here for a good time not a long time"',
        },
        {
          responseBody: '"Take me on an adventure"',
        },
        {
          responseBody: '"Looking for a sugar daddy"',
        },
      ],
      tags: [
        'dating',
        'starter',
      ],
    },
    {
      questionText: 'Are they hoesome or wholesome?',
      questionType: 'multipleChoiceWithOther',
      suggestedResponses: [
        {
          responseBody: 'EXTRA WHOLESOME',
        },
        {
          responseBody: 'Lil\' Wholesome',
        },
        {
          responseBody: 'Just right?',
        },
        {
          responseBody: 'Lil\' Hoesome',
        },
        {
          responseBody: 'HOESOME EXTRA HOESOME',
        },
      ],
      tags: [
        'dating',
        'spicy',
        'starter',
      ],
    },
  ],
};
