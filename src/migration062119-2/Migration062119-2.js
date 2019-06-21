import { User } from '../models/UserModel';
import { Match } from '../models/MatchModel';

const debug = require('debug')('dev:Migration2');
const mongoose = require('mongoose');

const dbHost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const mongoPrefix = dbHost.includes('localhost') ? 'mongodb://' : 'mongodb+srv://';
const dbUser = process.env.DB_USER ? process.env.DB_USER : '';
const dbPass = process.env.DB_PASS ? process.env.DB_PASS : '';
const dbName = process.env.DB_NAME ? process.env.DB_NAME : 'dev';
const MONGO_URL = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbName}?retryWrites=true`;

export const addMatchCounts = async () => {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true, useCreateIndex: true });
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
    const db = mongoose.connection;
    db.on('error', debug.bind(console, 'MongoDB connection error:'));
    db.once('open', async () => {
      const migrateUserPromises = [];
      debug('getting all matches');
      const matches = await Match.find({}).exec();
      debug(`got ${matches.length} matches`);
      debug('getting all users');
      const users = await User.find({}).exec();
      debug(`getting ${users.length} users`);
      const userMap = {};
      for (const user of users) {
        user.personalMatchesSentCount = 0;
        user.matchRequestsReceivedCount = 0;
        user.pearsSentCount = 0;
        user.pearsReceivedCount = 0;
        user.matchesCount = 0;
        user.matchRequestsRejectedCount = 0;
        user.matchRequestsAcceptedCount = 0;
        user.pearsRejectedCount = 0;
        user.pearsAcceptedCount = 0;
        userMap[user._id.toString()] = user;
      }
      for (const match of matches) {
        const sentByUser = userMap[match.sentByUser_id.toString()];
        const sentForUser = userMap[match.sentForUser_id.toString()];
        const receivedByUser = userMap[match.receivedByUser_id.toString()];
        if (match.isMatchmakerMade) {
          if (sentByUser) {
            sentByUser.pearsSentCount += 1;
          }
          if (sentForUser) {
            sentForUser.pearsReceivedCount += 1;
          }
          if (match.sentForUserStatus === 'accepted') {
            if (sentForUser) {
              sentForUser.pearsAcceptedCount += 1;
            }
          } else if (match.sentForUserStatus === 'rejected') {
            if (sentForUser) {
              sentForUser.pearsRejectedCount += 1;
            }
          }
        } else if (sentForUser) {
          sentForUser.personalMatchesSentCount += 1;
        }
        if (receivedByUser) {
          receivedByUser.matchRequestsReceivedCount += 1;
        }
        if (match.receivedByUserStatus === 'accepted') {
          if (receivedByUser) {
            receivedByUser.matchRequestsAcceptedCount += 1;
          }
        } else if (match.receivedByUserStatus === 'rejected') {
          if (receivedByUser) {
            receivedByUser.matchRequestsRejectedCount += 1;
          }
        }
        if (match.sentForUserStatus === 'accepted' && match.receivedByUserStatus === 'accepted') {
          if (sentForUser) {
            sentForUser.matchesCount += 1;
          }
          if (receivedByUser) {
            receivedByUser.matchesCount += 1;
          }
        }
      }
      let count = 0;
      users.forEach((user) => {
        migrateUserPromises.push(user.save()
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
      });
      Promise.all(migrateUserPromises)
        .then(() => {
          debug('Finished adding match counts');
        })
        .catch((err) => {
          debug(`error with adding match counts: ${err}`);
        });
    });
  } catch (e) {
    debug(e);
  }
};
