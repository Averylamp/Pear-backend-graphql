import 'babel-core/register';
import 'babel-polyfill';
import { start } from './start';
import { runTests } from './tests/RunTests';

const debug = require('debug')('dev:Index');
const testsLog = require('debug')('dev:tests:Index');

debug('Starting...');
testsLog('Starting...');
const devMode = process.env.DEV === 'true';
const regenTestDBMode = (process.env.REGEN_DB === 'true' && devMode);

if (devMode && regenTestDBMode) {
  testsLog('Prepared to run tests in 5 seconds');
  setTimeout(async () => {
    testsLog('Running Tests');
    await runTests();
  }, 5000);
}

start();
