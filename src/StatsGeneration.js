import { devMode, STAT_SNAPSHOT_GENERATION_TIME } from './constants';
import { saveStatsSnapshot } from './stats/Stats';

const debug = require('debug')('dev:StatsGeneration');
const prodConsole = require('debug')('prod:StatsGeneration');
const mongoose = require('mongoose');

// see https://github.com/Automattic/mongoose/issues/7150
mongoose.Schema.Types.String.checkRequired(v => v != null);

export const startStatsGeneration = async () => {
  if (process.env.PERF) {
    debug('Perf mode detected');
  }

  let dbName = 'prod2';
  if (devMode) {
    dbName = 'dev';
  }
  if (process.env.DB_NAME) {
    dbName = process.env.DB_NAME;
  }
  debug(`Database: ${dbName}`);
  prodConsole('Running in Prod');
  prodConsole(`Database: ${dbName}`);
  const MONGO_URL = `mongodb+srv://avery:e5nkGl40nt02kZXk@cluster0.29rmo.mongodb.net/${dbName}?retryWrites=true`;
  debug(MONGO_URL);

  const name = 'Stats Generation';
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
          debug('saving new stats snapshot');
          saveStatsSnapshot();
        } catch (e) {
          debug(`an error occurred in generating stats: ${e}`);
        }
      }, STAT_SNAPSHOT_GENERATION_TIME);
    });
  } catch (e) {
    debug(e);
  }
};
