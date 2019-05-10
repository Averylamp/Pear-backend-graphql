import {
  ADD_TO_QUEUE,
  CLEAR_FEED,
  CREATE_MATCH_REQUEST,
  CREATE_USER,
  SKIP_DISCOVERY_ITEM,
} from '../Mutations';
import { addToBrianQueue, createEmptyUsers } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';
import { BRIAN_ID, DISCOVERY_ITEM_ID0 } from '../TestsContants';
import { SEND_EMPTY_PEAR0, SEND_EMPTY_WAVE0 } from '../MatchActionVars';

const testLogger = require('debug')('tests:DiscoveryItemDecisionsTest');
const errorLogger = require('debug')('error:DiscoveryItemDecisionsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runDiscoveryItemDecisionsTest = async (mutate) => {
  testLog('TESTING: Creating empty users');
  for (const createEmptyUserVars of createEmptyUsers) {
    try {
      const result = await mutate(({
        mutation: CREATE_USER,
        variables: createEmptyUserVars,
      }));
      checkForAndLogErrors(result, 'createUser');
    } catch (e) {
      errorLog(`Error: ${e.toString()}`);
    }
  }

  testLog('TESTING: Clearing and resetting Brian\'s feed');
  try {
    const clearFeedResult = await mutate(({
      mutation: CLEAR_FEED,
      variables: { user_id: BRIAN_ID },
    }));
    checkForAndLogErrors(clearFeedResult, 'clearFeed');
  } catch (e) {
    errorLog(`Error: ${e.toString()}`);
  }

  testLog('TESTING: Adding empty users to Brian\'s feed');
  for (const addToBrianQueueVars of addToBrianQueue) {
    try {
      const result = await mutate(({
        mutation: ADD_TO_QUEUE,
        variables: addToBrianQueueVars,
      }));
      checkForAndLogErrors(result, 'addToQueue');
    } catch (e) {
      errorLog(`Error: ${e.toString()}`);
    }
  }

  testLog('TESTING: skip a discovery item');
  try {
    const skipResult = await mutate(({
      mutation: SKIP_DISCOVERY_ITEM,
      variables: {
        user_id: BRIAN_ID,
        discoveryItem_id: DISCOVERY_ITEM_ID0,
      },
    }));
    checkForAndLogErrors(skipResult, 'skipDiscoveryItem');
  } catch (e) {
    errorLog(`Error: ${e.toString()}`);
  }

  testLog('TESTING: wave to a discovery item');
  try {
    const waveResult = await mutate(({
      mutation: CREATE_MATCH_REQUEST,
      variables: SEND_EMPTY_WAVE0,
    }));
    checkForAndLogErrors(waveResult, 'createMatchRequest');
  } catch (e) {
    errorLog(`Error: ${e.toString()}`);
  }

  testLog('TESTING: pear a discovery item');
  try {
    const pearResult = await mutate(({
      mutation: CREATE_MATCH_REQUEST,
      variables: SEND_EMPTY_PEAR0,
    }));
    checkForAndLogErrors(pearResult, 'createMatchRequest');
  } catch (e) {
    errorLog(`Error: ${e.toString()}`);
  }

  successLog('***** Success Deciding on Discovery Items *****\n');
};
