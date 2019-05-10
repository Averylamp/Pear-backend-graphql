import { ATTACH_DETACHED_PROFILE } from '../Mutations';
import { verbose } from '../../constants';
import { attachProfiles } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:AttachDetachedProfilesTest');
const verboseDebug = require('debug')('tests:verbose:AttachDetachedProfilesTest');
const errorLogger = require('debug')('error:AttachDetachedProfilesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runAttachDetachedProfilesTest = async (mutate) => {
  testLog('TESTING: Attaching Detached Profiles');
  for (const attachProfileVars of attachProfiles) {
    try {
      const result = await mutate({
        mutation: ATTACH_DETACHED_PROFILE,
        variables: attachProfileVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'approveNewDetachedProfile');
    } catch (e) {
      errorLog((`${e}`));
      process.exit(1);
    }
  }
  successLog('***** Success Attaching Detached Profiles *****\n');
};
