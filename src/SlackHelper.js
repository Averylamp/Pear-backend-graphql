import { devMode } from './constants';

const request = require('request');
const errorLog = require('debug')('error:SlackHelper');
const debug = require('debug')('dev:SlackHelper');

export const postProfileCreation = async ({ userName, detachedUserName, contentItems }) => {
  if (devMode) {
    return;
  }
  const fields = [];
  fields.push({
    value: `${userName} created a Pear Profile for ${detachedUserName}`,
  });
  contentItems.forEach((contentItem) => {
    const questionTitle = contentItem.question.questionText;
    fields.push({
      title: questionTitle,
      value: contentItem.responseBody,
    });
  });

  request.post('https://hooks.slack.com/services/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', {
    json: {
      fallback: `${userName} created a Pear Profile for ${detachedUserName}`,
      fields,
    },
  }, (error, res, body) => {
    if (error) {
      errorLog(error);
      return;
    }
    debug(`statusCode: ${res.statusCode}`);
    debug(body);
  });
};


export const postProfileApproval = async ({ userName, creatorName, contentItems }) => {
  if (devMode) {
    return;
  }
  const fields = [];
  fields.push({
    value: `${userName} approved a Pear Profile written by ${creatorName}`,
  });
  contentItems.forEach((contentItem) => {
    const questionTitle = contentItem.question.questionText;
    fields.push({
      title: questionTitle,
      value: contentItem.responseBody,
    });
  });

  request.post('https://hooks.slack.com/services/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', {
    json: {
      fallback: `${userName} approved a Pear Profile written by ${creatorName}`,
      fields,
    },
  }, (error, res, body) => {
    if (error) {
      errorLog(error);
      return;
    }
    debug(`statusCode: ${res.statusCode}`);
    debug(body);
  });
};

export const postCreateUser = async ({ userPhone }) => {
  if (devMode) {
    return;
  }
  request.post('https://hooks.slack.com/services/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', {
    json: {
      fallback: `${userPhone} just joined Pear!`,
      text: `${userPhone} just joined Pear!`,
    },
  }, (error, res, body) => {
    if (error) {
      errorLog(error);
      return;
    }
    debug(`statusCode: ${res.statusCode}`);
    debug(body);
  });
};
