import { createEvents } from '../CreateTestDB';
import { CREATE_EVENT } from '../Mutations';
import { verbose } from '../../constants';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:CreateEventsTest');
const verboseDebug = require('debug')('tests:verbose:CreateEventsTest');
const errorLogger = require('debug')('error:CreateEventsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runCreateEventsTest = async (mutate) => {
  testLog('TESTING: Create Events');
  for (const eventVars of createEvents) {
    try {
      const result = await mutate({
        mutation: CREATE_EVENT,
        variables: eventVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'createEvent', errorLog);
    } catch (e) {
      errorLog(`${e}`);
      process.exit(1);
    }
  }
  successLog('***** Success Creating Events *****\n');
};
