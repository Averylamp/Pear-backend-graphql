import 'babel-core/register';
import 'babel-polyfill';
import { start } from './start';
import { runTests } from './tests/RunTests';
import startStatsGeneration from './StatsGeneration';
import startDiscoveryGeneration from './DiscoveryGeneration';

const debug = require('debug')('dev:Index');
const testsLog = require('debug')('tests:Index');

debug('Starting...');
testsLog('Starting...');
const devMode = process.env.DEV === 'true';
const regenTestDBMode = (process.env.REGEN_DB === 'true' && devMode);

if (devMode && regenTestDBMode) {
  testsLog('Prepared to run tests in 3 second');
  setTimeout(async () => {
    testsLog('Running Tests');
    await runTests();
  }, 3000);
}

if (process.env.TASK === 'stats-generation') {
  debug('starting stats generation');
  startStatsGeneration();
} else if (process.env.TASK === 'discovery-generation') {
  debug('starting discovery generation');
  startDiscoveryGeneration();
} else if (!process.env.TASK) {
  start();
}
