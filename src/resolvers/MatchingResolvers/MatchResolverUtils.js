import { User } from '../../models/UserModel';
import { Match } from '../../models/MatchModel';

const errorLogger = require('debug')('error:Matching');

const chalk = require('chalk');

const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));

export const getAndValidateUserAndMatchObjects = async ({ user_id, match_id, validationType }) => {
  const userPromise = User.findById(user_id)
    .exec()
    .catch(() => null);
  const matchPromise = Match.findById(match_id)
    .exec()
    .catch(() => null);
  const [user, match] = await Promise.all([userPromise, matchPromise]);
  if (!user) {
    errorLog(`Couldn't find user with id ${user_id}`);
    throw new Error(`Couldn't find user with id ${user_id}`);
  }
  if (!match) {
    errorLog(`Couldn't find match with id ${match_id}`);
    throw new Error(`Couldn't find match with id ${match_id}`);
  }
  let otherUser_id = null;
  if (user_id === match.sentForUser_id.toString()) {
    otherUser_id = match.receivedByUser_id;
  } else if (user_id === match.receivedByUser_id.toString()) {
    otherUser_id = match.sentForUser_id;
  } else {
    errorLog(`User ${user_id} is not a part of match ${match_id}`);
    throw new Error(`User ${user_id} is not a part of match ${match_id}`);
  }
  const otherUser = await User.findById(otherUser_id);
  if (!otherUser) {
    errorLog(`Couldn't find user's match partner with id ${otherUser_id}`);
    throw new Error(`Couldn't find user's match partner with id ${otherUser_id}`);
  }
  if (['reject', 'accept'].includes(validationType)) {
    if (user_id === match.sentForUser_id.toString()) {
      if (['rejected', 'accepted'].includes(match.sentForUserStatus)) {
        errorLog(`User ${user_id} has already taken action on request ${match_id}`);
        throw new Error(`User ${user_id} has already taken action on request ${match_id}`);
      }
    } else if (user_id === match.receivedByUser_id.toString()) {
      if (['rejected', 'accepted'].includes(match.receivedByUserStatus)) {
        errorLog(`User ${user_id} has already taken action on request ${match_id}`);
        throw new Error(`User ${user_id} has already taken action on request ${match_id}`);
      }
    }
  }
  if (validationType === 'unmatch') {
    if (match.sentForUserStatus !== 'accepted' || match.receivedByUserStatus !== 'accepted') {
      // No need to log it because it isn't fatal
      throw new Error('This request was not mutually accepted');
    }
  }
  return [user, match, otherUser];
};
