import { VIEW_DETACHED_PROFILE } from '../Mutations';
import { verbose } from '../../constants';
import { viewDetachedProfiles } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:ViewDetachedProfilesTest');
const verboseDebug = require('debug')('tests:verbose:ViewDetachedProfilesTest');
const errorLogger = require('debug')('error:ViewDetachedProfilesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runViewDetachedProfilesTest = async (mutate) => {
  testLog('TESTING: Viewing Detached Profiles');
  for (const viewProfileVars of viewDetachedProfiles) {
    try {
      const result = await mutate({
        mutation: VIEW_DETACHED_PROFILE,
        variables: viewProfileVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'viewDetachedProfile', errorLog);
    } catch (e) {
      errorLog((`${e}`));
      process.exit(1);
    }
  }
  successLog('***** Success Viewing Detached Profiles *****\n');
};
