import { EDIT_DETACHED_PROFILE } from '../Mutations';
import { verbose } from '../../constants';
import { editDetachedProfiles } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:EditDetachedProfilesTest');
const verboseDebug = require('debug')('tests:verbose:EditDetachedProfilesTest');
const errorLogger = require('debug')('error:EditDetachedProfilesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runEditDetachedProfilesTest = async (mutate) => {
  testLog('TESTING: Editing Detached Profiles');
  for (const editDetachedProfileVars of editDetachedProfiles) {
    try {
      const result = await mutate({
        mutation: EDIT_DETACHED_PROFILE,
        variables: editDetachedProfileVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'editDetachedProfile');
    } catch (e) {
      errorLog((`${e}`));
      process.exit(1);
    }
  }
  successLog('***** Success Editing Detached Profiles *****\n');
};
