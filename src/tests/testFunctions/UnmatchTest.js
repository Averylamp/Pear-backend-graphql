import { UNMATCH } from '../Mutations';
import { unmatches } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:UnmatchTest');
const errorLogger = require('debug')('error:UnmatchTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runUnmatchTest = async (mutate) => {
  testLog('TESTING: Unmatching');
  for (const unmatchVars of unmatches) {
    try {
      const result = await mutate(({
        mutation: UNMATCH,
        variables: unmatchVars,
      }));
      checkForAndLogErrors(result, 'unmatch', errorLog);
    } catch (e) {
      errorLog((`Error: ${e.toString()}`));
    }
  }
  successLog('***** Success Unmatching *****\n');
};
