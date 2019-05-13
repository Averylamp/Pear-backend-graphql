import { CREATE_DETACHED_PROFILE } from '../Mutations';
import { verbose } from '../../constants';
import { createDetachedProfiles } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:CreateDetachedProfilesTest');
const verboseDebug = require('debug')('tests:verbose:CreateDetachedProfilesTest');
const errorLogger = require('debug')('error:CreateDetachedProfilesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runCreateDetachedProfilesTest = async (mutate) => {
  testLog('TESTING: Creating Detached Profiles');
  for (let i = 0; i < createDetachedProfiles.length; i += 1) {
    const detachedProfileVars = createDetachedProfiles[i];
    try {
      const result = await mutate({
        mutation: CREATE_DETACHED_PROFILE,
        variables: detachedProfileVars,
      });

      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'createDetachedProfile');
    } catch (e) {
      errorLog((`${e}`));
      process.exit(1);
    }
  }
  successLog('***** Success Creating Detached Profiles *****\n');
};
