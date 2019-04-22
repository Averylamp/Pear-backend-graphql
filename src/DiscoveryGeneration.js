import { updateAllDiscovery } from './discovery/DiscoverProfile';
import { TICK_LENGTH_MILLIS } from './constants';

const debug = require('debug')('dev:DiscoveryGeneration');
const prodConsole = require('debug')('prod:DiscoveryGeneration');
const mongoose = require('mongoose');

// see https://github.com/Automattic/mongoose/issues/7150
mongoose.Schema.Types.String.checkRequired(v => v != null);

export const startDiscoveryGeneration = async () => {
  if (process.env.PERF) {
    debug('Perf mode detected');
  }

  const devMode = process.env.DEV === 'true';
  let dbName = 'prod';
  if (devMode) {
    dbName = 'dev';
  }
  if (process.env.DB_NAME) {
    dbName = process.env.DB_NAME;
  }
  debug(`Database: ${dbName}`);
  prodConsole('Running in Prod');
  prodConsole(`Database: ${dbName}`);
  const MONGO_URL = `mongodb+srv://avery:0bz8M0eMEtyXlj2aZodIPpJpy@cluster0-w4ecv.mongodb.net/${dbName}?retryWrites=true`;
  debug(MONGO_URL);


  const name = 'Discovery Generation';
  debug('Booting %s', name);

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

      setInterval(() => {
        try {
          debug('updating all discoveries');
          updateAllDiscovery();
        } catch (e) {
          debug(`an error occurred in updating discoveries: ${e}`);
        }
      }, TICK_LENGTH_MILLIS);
    });
  } catch (e) {
    debug(e);
  }
};
