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

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const shuffle = (arr) => {
  const array = arr; // no parameter reassign eslint
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
