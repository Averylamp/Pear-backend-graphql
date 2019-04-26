const debug = require('debug')('dev:Migration1Setup');

const dbHost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const mongoPrefix = dbHost.includes('localhost') ? 'mongodb://' : 'mongodb+srv://';
const dbNameOld = process.env.DB_NAME_OLD ? process.env.DB_NAME_OLD : 'dev-migrations';
const dbUser = process.env.DB_USER ? process.env.DB_USER : '';
const dbPass = process.env.DB_PASS ? process.env.DB_PASS : '';
debug(`Migrating from old database: ${dbNameOld}`);

export const MONGO_URL_OLD_DB = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbNameOld}?retryWrites=true`;
const mongoose = require('mongoose');

// see https://github.com/Automattic/mongoose/issues/7150
mongoose.Schema.Types.String.checkRequired(v => v != null);

export const dbOld = mongoose.createConnection(MONGO_URL_OLD_DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
});

const dbNameNew = process.env.DB_NAME ? process.env.DB_NAME : 'dev';
debug(`Migrating to new database: ${dbNameNew}`);

export const MONGO_URL_NEW_DB = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbNameNew}?retryWrites=true`;
mongoose.connect(MONGO_URL_NEW_DB, { useNewUrlParser: true, useCreateIndex: true });
