import { ADD_QUESTIONS } from '../Mutations';
import { verbose } from '../../constants';
import { addQuestions } from '../CreateTestDB';

const testLogger = require('debug')('tests:AddQuestionsTest');
const verboseDebug = require('debug')('tests:verbose:AddQuestionsTest');
const errorLogger = require('debug')('error:AddQuestionsTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runAddQuestionsTest = async (mutate) => {
  testLog('TESTING: Add Questions');
  try {
    const result = await mutate({
      mutation: ADD_QUESTIONS,
      variables: addQuestions,
    });
    if (verbose) {
      verboseDebug(result);
    }
  } catch (e) {
    errorLog(`${e}`);
    process.exit(1);
  }
  successLog('***** Success Adding Questions *****\n');
};
