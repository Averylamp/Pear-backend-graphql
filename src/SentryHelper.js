import * as Sentry from '@sentry/node';

const debug = require('debug')('debug:SentryHelper');
const errorLog = require('debug')('err:SentryHelper');

export const generateSentryErrorForResolver = ({
  resolverType, routeName, args, errorMsg, errorName,
}) => {
  try {
    Sentry.withScope((scope) => {
      debug('sending exception');
      scope.setTag(resolverType, routeName);
      scope.setLevel('error');
      scope.setExtra('error message', errorMsg);
      for (const key in args) {
        // https://eslint.org/docs/rules/guard-for-in
        if (Object.prototype.hasOwnProperty.call(args, key)) {
          scope.setExtra(key, args[key]);
        }
      }
      Sentry.captureException(new Error(errorName));
    });
  } catch (e) {
    errorLog(`couldn't send sentry error for reason: ${e}`);
    errorLog({
      resolverType, routeName, args, errorMsg, errorName,
    });
  }
};

export const generateSentryError = ({
  args, errorMsg, errorName,
}) => {
  try {
    Sentry.withScope((scope) => {
      debug('sending exception');
      scope.setLevel('error');
      scope.setExtra('error message', errorMsg);
      for (const key in args) {
        // https://eslint.org/docs/rules/guard-for-in
        if (Object.prototype.hasOwnProperty.call(args, key)) {
          scope.setExtra(key, args[key]);
        }
      }
      Sentry.captureException(new Error(errorName));
    });
  } catch (e) {
    errorLog(`couldn't send sentry error for reason: ${e}`);
    errorLog({
      args, errorMsg, errorName,
    });
  }
};
