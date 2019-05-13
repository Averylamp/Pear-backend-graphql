import { UPDATE_USER } from '../Mutations';
import { verbose } from '../../constants';
import { updateUsers } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:UpdateUsersTest');
const verboseDebug = require('debug')('tests:verbose:UpdateUsersTest');
const errorLogger = require('debug')('error:UpdateUsersTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runUpdateUsersTest = async (mutate) => {
  testLog('TESTING: Updating Users');
  for (const updateUserVars of updateUsers) {
    try {
      const result = await mutate({
        mutation: UPDATE_USER,
        variables: updateUserVars,
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
