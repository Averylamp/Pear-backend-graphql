import { User } from '../models/UserModel';

const debug = require('debug')('dev:UserModel');
const mongoose = require('mongoose');

const dbHost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const mongoPrefix = dbHost.includes('localhost') ? 'mongodb://' : 'mongodb+srv://';
const dbUser = process.env.DB_USER ? process.env.DB_USER : '';
const dbPass = process.env.DB_PASS ? process.env.DB_PASS : '';
const dbName = process.env.DB_NAME ? process.env.DB_NAME : 'dev';
const MONGO_URL = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbName}?retryWrites=true`;

export const addNotificationsEnabled = async () => {
  debug('adding notificationsEnabled field');
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true, useCreateIndex: true });
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
    const db = mongoose.connection;
    db.on('error', debug.bind(console, 'MongoDB connection error:'));
    db.once('open', async () => {
      let count = 0;
      const userMigrationPromises = [];
      await new Promise((resolve, reject) => {
        User.find({})
          .cursor()
          .on('data', (user) => {
            const userObj = user; // no-param-reassign
            userObj.notificationsEnabled = false;
            userMigrationPromises
              .push(userObj.save()
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
            Promise.all(userMigrationPromises)
              .then(() => {
                debug('Finished adding field');
                resolve();
              })
              .catch((err) => {
                debug(`Error adding field: ${err}`);
                reject(err);
              });
          });
      });
    });
  } catch (e) {
    debug(e);
  }
};
