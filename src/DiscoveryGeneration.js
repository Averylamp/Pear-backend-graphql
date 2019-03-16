const debug = require('debug')('dev:DiscoveryGeneration');
const prodConsole = require('debug')('prod:DiscoveryGeneration');

if (process.env.PERF) {
  debug('Perf mode detected');
}

let devMode = false;
let regenTestDBMode = false;
if (process.env.DEV === 'true') {
  debug('Dev Mode detected');
  devMode = true;
  if (process.env.REGENDB === true) {
    regenTestDBMode = true;
  }
}

let dbName = 'prod';
if (devMode) {
  dbName = 'dev-test';
  if (regenTestDBMode) {
    debug('Regen Test DB Mode Detected');
    dbName = 'dev-test';
  }
  debug(`Database: ${dbName}`);
}
prodConsole('Running in Prod');
prodConsole(`Database: ${dbName}`);

const MONGO_URL = `mongodb+srv://avery:0bz8M0eMEtyXlj2aZodIPpJpy@cluster0-w4ecv.mongodb.net/${dbName}?retryWrites=true`;
const mongoose = require('mongoose');

debug(MONGO_URL);

const name = 'Discovery Generation';
debug('Booting %s', name);

export const start = async () => {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
    const db = mongoose.connection;
    db.on('error', debug.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
      debug('Mongo connected');
      prodConsole('Mongo connected');
    });
  } catch (e) {
    debug(e);
  }
};


export default start;
