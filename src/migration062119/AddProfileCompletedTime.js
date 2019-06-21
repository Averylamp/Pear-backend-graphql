import { User } from '../models/UserModel';

const debug = require('debug')('dev:Migration2');
const mongoose = require('mongoose');

const dbHost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const mongoPrefix = dbHost.includes('localhost') ? 'mongodb://' : 'mongodb+srv://';
const dbUser = process.env.DB_USER ? process.env.DB_USER : '';
const dbPass = process.env.DB_PASS ? process.env.DB_PASS : '';
const dbName = process.env.DB_NAME ? process.env.DB_NAME : 'dev';
const MONGO_URL = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbName}?retryWrites=true`;

const migrateUser = async (user) => {
  const newUser = user;
  if (newUser.questionResponsesCount > 0 && newUser.endorsementEdges.length > 0) {
    newUser.profileCompletedTime = newUser.endorsementEdges[0].createdAt;
    return newUser.save();
  }
  return user;
};

export const addProfileCompletedTime = async () => {
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
                    if (count % 10 === 0) {
                      debug(`${count} migrated so far: migrated ${doc.firstName}`);
                    }
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
