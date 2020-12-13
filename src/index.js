import 'babel-core/register';
import 'babel-polyfill';
import * as Sentry from '@sentry/node';
import { start } from './start';
import { runTests } from './tests/RunTests';
import { startStatsGeneration } from './StatsGeneration';
import {
  devMode,
  regenTestDBMode,
} from './constants';


const debug = require('debug')('dev:Index');
const testsLog = require('debug')('tests:Index');
const errorLog = require('debug')('error:Index');

const fs = require('fs').promises;

const init = async () => {
  debug('Starting...');
  testsLog('Starting...');

  if (!devMode) {
    const release = await fs
      .readFile('./release')
      .then(buf => (buf.toString()))
      .catch((err) => {
        debug(`error occurred getting release number: ${err}`);
        return undefined;
      });
    // Sentry.init({
    //   dsn: 'https://36d239d65e4a45f2860c4be88eb44e70@sentry.io/1444442',
    //   release,
    // });
    // debug('sentry initialized');
  }

  if (regenTestDBMode) {
    if (process.env.DB_NAME === 'prod2') {
      errorLog('ERROR: CAN\'T REGENDB PROD DATABASE');
    } else {
      testsLog('Prepared to run tests in 3 second');
      setTimeout(async () => {
        testsLog('Running Tests');
        await runTests();
      }, 3000);
    }
  } else if (process.env.TASK === 'stats-generation') {
    debug('starting stats generation');
    startStatsGeneration();
  } else if (!process.env.TASK) {
    start();
  }
};

init();
