import 'babel-core/register';
import 'babel-polyfill';
import { start } from './start';
import { runTests } from './tests/RunTests';

const debug = require('debug')('dev:Index');

debug('Starting...');

let devMode = false;
let regenTestDBMode = false;
if (process.env.DEV === 'true') {
  devMode = true;
  debug('Dev detected');
  if (process.env.REGENDB === 'true') {
    debug('Regendb detected');
    regenTestDBMode = true;
  }
}


if (devMode && regenTestDBMode) {
  debug('Prepared to run tests in 5 seconds');
  setTimeout(async () => {
    debug('Running Tests');
    await runTests();
  }, 5000);
}

start();
