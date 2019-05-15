import { addEventCodes } from '../CreateTestDB';
import { ADD_EVENT_CODE } from '../Mutations';
import { verbose } from '../../constants';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:AddEventCodesTest');
const verboseDebug = require('debug')('tests:verbose:AddEventCodesTest');
const errorLogger = require('debug')('error:AddEventCodesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runAddEventCodesTest = async (mutate) => {
  testLog('TESTING: Adding Event Codes');
  for (const addEventVars of addEventCodes) {
    try {
      const result = await mutate({
        mutation: ADD_EVENT_CODE,
        variables: addEventVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'addEventCode', errorLog);
    } catch (e) {
      errorLog(`${e}`);
      process.exit(1);
    }
  }
  successLog('***** Success Adding Event Codes *****\n');
};
