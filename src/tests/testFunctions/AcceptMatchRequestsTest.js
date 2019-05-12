import { ACCEPT_REQUEST } from '../Mutations';
import { acceptRequests } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:AcceptMatchRequestsTest');
const errorLogger = require('debug')('error:AcceptMatchRequestsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runAcceptMatchRequestsTest = async (mutate) => {
  testLog('TESTING: Accepting Match Requests');
  for (const acceptRequestVars of acceptRequests) {
    try {
      const result = await mutate(({
        mutation: ACCEPT_REQUEST,
        variables: acceptRequestVars,
      }));
      checkForAndLogErrors(result, 'acceptRequest');
    } catch (e) {
      errorLog((`Error: ${e.toString()}`));
    }
  }
  successLog('***** Success Accepting Match Requests *****\n');
};
