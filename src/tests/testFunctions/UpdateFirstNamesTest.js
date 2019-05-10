import { UPDATE_USER } from '../Mutations';
import { verbose } from '../../constants';
import { updateUserFirstNames } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:UpdateFirstNamesTest');
const verboseDebug = require('debug')('tests:verbose:UpdateFirstNamesTest');
const errorLogger = require('debug')('error:UpdateFirstNamesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runUpdateFirstNamesTest = async (mutate) => {
  testLog('TESTING: Updating User First Names');
  for (const updateUserFirstNameVars of updateUserFirstNames) {
    try {
      const result = await mutate({
        mutation: UPDATE_USER,
        variables: updateUserFirstNameVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'updateUser');
    } catch (e) {
      errorLog((`${e}`));
      process.exit(1);
    }
  }
  successLog('***** Success Updating Users *****\n');
};
