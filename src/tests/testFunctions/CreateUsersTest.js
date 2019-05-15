import { CREATE_USER } from '../Mutations';
import { verbose } from '../../constants';
import { createUsers } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:CreateUsersTest');
const verboseDebug = require('debug')('tests:verbose:CreateUsersTest');
const errorLogger = require('debug')('error:CreateUsersTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runCreateUsersTest = async (mutate) => {
  testLog('TESTING: Create Users');
  for (const userVars of createUsers) {
    try {
      const result = await mutate({
        mutation: CREATE_USER,
        variables: userVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'createUser', errorLog);
    } catch (e) {
      errorLog(`${e}`);
      process.exit(1);
    }
  }
  successLog('***** Success Creating Users *****\n');
};
