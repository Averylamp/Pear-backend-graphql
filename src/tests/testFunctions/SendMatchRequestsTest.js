import { CREATE_MATCH_REQUEST } from '../Mutations';
import { sendMatchmakerRequests, sendPersonalRequests } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:SendMatchRequestsTest');
const errorLogger = require('debug')('error:SendMatchRequestsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runSendMatchRequestsTest = async (mutate) => {
  testLog('TESTING: Sending Match Requests');
  for (const sendPersonalRequestVars of sendPersonalRequests) {
    try {
      const result = await mutate(({
        mutation: CREATE_MATCH_REQUEST,
        variables: sendPersonalRequestVars,
      }));
      checkForAndLogErrors(result, 'createMatchRequest');
    } catch (e) {
      errorLog((`Error: ${e.toString()}`));
    }
  }
  for (const sendMatchmakerRequestVars of sendMatchmakerRequests) {
    try {
      const result = await mutate(({
        mutation: CREATE_MATCH_REQUEST,
        variables: sendMatchmakerRequestVars,
      }));
      checkForAndLogErrors(result, 'createMatchRequest');
    } catch (e) {
      errorLog((`Error: ${e.toString()}`));
    }
  }
  successLog('***** Success Sending Match Requests *****\n');
};
