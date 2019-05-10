import { FORCE_FEED_UPDATE } from '../Mutations';
import { updateFeeds } from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';

const testLogger = require('debug')('tests:GenerateDiscoveryItemsTest');
const errorLogger = require('debug')('error:GenerateDiscoveryItemsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runGenerateDiscoveryItemsTest = async (mutate) => {
  testLog('TESTING: Generating Discovery Items');
  let discoveryIterations = 4;
  if (process.env.DISCOVERY_GENERATION_ROUNDS
    && Number(process.env.DISCOVERY_GENERATION_ROUNDS)) {
    const rounds = Number(process.env.DISCOVERY_GENERATION_ROUNDS);
    discoveryIterations = rounds;
  }
  testLog(`ROUNDS: ${discoveryIterations}`);
  for (let i = 0; i < discoveryIterations; i += 1) {
    for (const updateFeedVars of updateFeeds) {
      try {
        const result = await mutate(({
          mutation: FORCE_FEED_UPDATE,
          variables: updateFeedVars,
        }));
        checkForAndLogErrors(result, 'forceUpdateFeed');
      } catch (e) {
        errorLog((`Error: ${e.toString()}`));
      }
    }
    successLog(`* Successful Discovery Round ${i + 1} *\n`);
  }
  successLog('***** Success Generating Discovery Items *****\n');
};
