import { UserOld } from '../../models-old/UserModel';

const debug = require('debug')('dev:Migration1');

const dbHost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const mongoPrefix = dbHost.includes('localhost') ? 'mongodb://' : 'mongodb+srv://';
const dbName = process.env.DB_NAME ? process.env.DB_NAME : 'dev-migrations';
const dbUser = process.env.DB_USER ? process.env.DB_USER : '';
const dbPass = process.env.DB_PASS ? process.env.DB_PASS : '';
debug(`Database: ${dbName}`);

export const MONGO_URL = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbName}?retryWrites=true`;
const mongoose = require('mongoose');

export const dbOld = mongoose.createConnection(MONGO_URL);

export const runMigration = async () => {
  const someOldUser = await UserOld.findOne();
  debug(someOldUser);
};
