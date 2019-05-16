import { REJECT_REQUEST } from '../Mutations';
import { rejectRequests } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:RejectMatchRequestsTest');
const errorLogger = require('debug')('error:RejectMatchRequestsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runRejectMatchRequestsTest = async (mutate) => {
  testLog('TESTING: Rejecting Match Requests');
  for (const rejectRequestVars of rejectRequests) {
    try {
      const result = await mutate(({
        mutation: REJECT_REQUEST,
        variables: rejectRequestVars,
      }));
      checkForAndLogErrors(result, 'rejectRequest', errorLog);
    } catch (e) {
      errorLog((`Error: ${e.toString()}`));
    }
  }
  successLog('***** Success Rejecting Match Requests *****\n');
};
