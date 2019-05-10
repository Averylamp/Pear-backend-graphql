export const checkForAndLogErrors = (result, keyName, errorLog) => {
  // result is a graphql result object
  if (result.data && result.data[keyName]
    && !result.data[keyName].success) {
    errorLog(
      `Error performing action ${keyName}: ${result.data[keyName].message}`,
    );
  } else if (result.errors) {
    errorLog(`Error with request ${keyName}: ${result.errors}`);
  }
};
