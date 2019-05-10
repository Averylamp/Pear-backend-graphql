import { EDIT_ENDORSEMENT } from '../Mutations';
import { verbose } from '../../constants';
import { editEndorsements } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:EditEndorsementsTest');
const verboseDebug = require('debug')('tests:verbose:EditEndorsementsTest');
const errorLogger = require('debug')('error:EditEndorsementsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runEditEndorsementsTest = async (mutate) => {
  testLog('TESTING: Editing Endorsements');
  for (const editEndorsementVars of editEndorsements) {
    try {
      const result = await mutate({
        mutation: EDIT_ENDORSEMENT,
        variables: editEndorsementVars,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'editEndorsement');
    } catch (e) {
      errorLog((`${e}`));
      process.exit(1);
    }
  }
  successLog('***** Success Editing Endorsements *****\n');
};
