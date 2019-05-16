import { User } from '../models/UserModel';

const debug = require('debug')('dev:Migration2');
const mongoose = require('mongoose');

const dbHost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const mongoPrefix = dbHost.includes('localhost') ? 'mongodb://' : 'mongodb+srv://';
const dbUser = process.env.DB_USER ? process.env.DB_USER : '';
const dbPass = process.env.DB_PASS ? process.env.DB_PASS : '';
const dbName = process.env.DB_NAME ? process.env.DB_NAME : 'dev';
const MONGO_URL = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbName}?retryWrites=true`;

const doQuestion_id = mongoose.Types.ObjectId();
const doQuestion = {
  _id: doQuestion_id,
  questionText: 'Tips for dating them: do...',
  questionTextWithName: 'Tips for dating {{name}}: don\'t...',
  questionType: 'freeResponse',
  suggestedResponses: [],
  tags: ['dodont'],
  hiddenInQuestionnaire: true,
  hiddenInProfile: false,
};

const dontQuestion_id = mongoose.Types.ObjectId();
const dontQuestion = {
  _id: dontQuestion_id,
  questionText: 'Tips for dating them: don\'t...',
  questionTextWithName: 'Tips for dating {{name}}: don\'t...',
  questionType: 'freeResponse',
  suggestedResponses: [],
  tags: ['dodont'],
  hiddenInQuestionnaire: true,
  hiddenInProfile: false,
};

const boastQuestion_id = mongoose.Types.ObjectId();
const boastQuestion = {
  _id: dontQuestion_id,
  questionText: 'The pro(s) of dating them 😇',
  questionTextWithName: 'The pro(s) of dating {{name}} 😇',
  questionType: 'freeResponse',
  suggestedResponses: [],
  tags: ['boastroast'],
  hiddenInQuestionnaire: true,
  hiddenInProfile: false,
};

const roastQuestion_id = mongoose.Types.ObjectId();
const roastQuestion = {
  _id: dontQuestion_id,
  questionText: 'Roast them a little 😈',
  questionType: 'freeResponse',
  suggestedResponses: [],
  tags: ['boastroast'],
  hiddenInQuestionnaire: true,
  hiddenInProfile: false,
};

const contentToQuestionResponses = (items, question_id, question) => {
  const author_ids = Array.from(new Set(items.map(item => item.author_id.toString())));
  const authorContentMap = {};
  const author_idFirstnameMap = {};
  for (const author_id of author_ids) {
    authorContentMap[author_id] = [];
  }
  for (const item of items) {
    authorContentMap[item.author_id.toString()].push(item.content);
    author_idFirstnameMap[item.author_id.toString()] = item.authorFirstName;
  }
  const ret = [];
  Object.keys(authorContentMap).forEach((key) => {
    const questionResponse = {
      author_id: key,
      authorFirstName: author_idFirstnameMap[key],
      question_id,
      question,
      responseBody: '',
    };
    if (authorContentMap[key].length === 1) {
      [questionResponse.responseBody] = authorContentMap[key];
    } else {
      questionResponse.responseBody = authorContentMap[key].join('\n- ');
      questionResponse.responseBody = `- ${questionResponse.responseBody}`;
    }
    ret.push(questionResponse);
  });
  return ret;
};

const migrateUser = async (user) => {
  debug(`migrating user ${user._id}`);
  const newUser = user;
  const dosResponses = contentToQuestionResponses(user.dos, doQuestion_id, doQuestion);
  const dontsResponses = contentToQuestionResponses(user.donts, dontQuestion_id, dontQuestion);
  const boastsResponses = contentToQuestionResponses(user.boasts, boastQuestion_id, boastQuestion);
  const roastsResponses = contentToQuestionResponses(user.roasts, roastQuestion_id, roastQuestion);
  for (const responses of [dosResponses, dontsResponses, boastsResponses, roastsResponses]) {
    for (const response of responses) {
      debug(response);
      newUser.questionResponses.push(response);
    }
  }
  return newUser.save();
};

export const runMigration2 = async () => {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true, useCreateIndex: true });
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
    const db = mongoose.connection;
    db.on('error', debug.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
      const migrateUserPromises = [];
      let count = 0;

      return new Promise((resolve, reject) => {
        User.find({})
          .cursor()
          .on('data', (user) => {
            migrateUserPromises
              .push(migrateUser(user)
                .then((doc) => {
                  if (!doc) {
                    debug('doc not found');
                    debug(`user id is ${user._id}`);
                  } else {
                    count += 1;
                    debug(`${count} migrated so far: migrated ${doc.firstName}`);
                  }
                })
                .catch((err) => {
                  debug(`error occurred for user ${user._id}: ${err}`);
                }));
          })
          .on('end', async () => {
            Promise.all(migrateUserPromises)
              .then(() => {
                debug('Finished migration 2');
                resolve();
              })
              .catch((err) => {
                debug(`error with migration 2: ${err}`);
                reject(err);
              });
          });
      });
    });
  } catch (e) {
    debug(e);
  }
};
