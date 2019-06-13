import { Match } from '../../models/MatchModel';
import { User } from '../../models/UserModel';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { UNMATCH_ERROR } from '../ResolverErrorStrings';
import { getAndValidateUserAndMatchObjects } from './MatchResolverUtils';
import { rollbackObject } from '../../../util/util';
import { datadogStats } from '../../DatadogHelper';

const debug = require('debug')('dev:Unmatch');
const errorLogger = require('debug')('error:Unmatch');
const chalk = require('chalk');

const errorStyling = chalk.red.bold;
const errorLog = log => errorLogger(errorStyling(log));

export const unmatchResolver = async ({ user_id, match_id, reason }) => {
  // get and validate user and match objects
  const promisesResult = await getAndValidateUserAndMatchObjects({
    user_id,
    match_id,
    validationType: 'unmatch',
  });
  datadogStats.increment('server.stats.user_unmatched');

  const user = promisesResult[0];
  const match = promisesResult[1];
  const otherUser = promisesResult[2];
  const initialUser = user.toObject();
  const initialMatch = match.toObject();
  const initialOtherUser = otherUser.toObject();

  // update the match object
  const matchUpdateObj = {
    unmatched: true,
    unmatchedBy_id: user_id,
    unmatchedTimestamp: new Date(),
  };
  if (reason) {
    matchUpdateObj.unmatchedReason = reason;
  }
  const matchUpdate = await Match.findByIdAndUpdate(match_id, matchUpdateObj, { new: true })
    .exec()
    .catch(err => err);

  // update the user objects: currentMatch_ids list, and edges
  const edgeUpdate = await User.updateMany({
    _id: { $in: [user_id, otherUser._id.toString()] },
  }, {
    $pull: {
      currentMatch_ids: match_id,
    },
    'edgeSummaries.$[element].edgeStatus': 'unmatched',
    'edgeSummaries.$[element].lastStatusChange': new Date(),
  }, {
    arrayFilters: [{ 'element.match_id': match_id }],
  }).exec()
    .catch(err => err);

  // if any errors, roll back
  if (matchUpdate instanceof Error || edgeUpdate instanceof Error) {
    debug('error unmatching; rolling back');
    let errorMessage = '';
    if (matchUpdate instanceof Error) {
      errorMessage += matchUpdate.toString();
    }
    if (edgeUpdate instanceof Error) {
      errorMessage += edgeUpdate.toString();
    }
    await rollbackObject({
      model: User,
      object_id: user_id,
      initialObject: initialUser,
      onSuccess: () => { debug('rolled back me user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back me user object: ${err}`); },
    });
    await rollbackObject({
      model: User,
      object_id: otherUser._id.toString(),
      initialObject: initialOtherUser,
      onSuccess: () => { debug('rolled back other user object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back other user object: ${err}`); },
    });
    await rollbackObject({
      model: Match,
      object_id: match_id,
      initialObject: initialMatch,
      onSuccess: () => { debug('rolled back match object successfully'); },
      onFailure: (err) => { errorLog(`error rolling back match object: ${err}`); },
    });
    errorLog(`Error occurred unmatching: ${errorMessage}`);
    generateSentryErrorForResolver({
      resolverType: 'mutation',
      routeName: 'unmatch',
      args: { user_id, match_id, reason },
      errorMsg: errorMessage,
      errorName: UNMATCH_ERROR,
    });
    return {
      success: false,
      message: UNMATCH_ERROR,
    };
  }
  return {
    success: true,
    match: matchUpdate,
  };
};
