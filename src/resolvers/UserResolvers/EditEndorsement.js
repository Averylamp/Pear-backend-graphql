import { User } from '../../models/UserModel';
import {
  EDIT_ENDORSEMENT_ERROR,
  GET_USER_ERROR, WRONG_CREATOR_ERROR,
} from '../ResolverErrorStrings';
import { LAST_EDITED_ARRAY_LEN } from '../../constants';
import { generateSentryErrorForResolver } from '../../SentryHelper';

const errorLog = require('debug')('error:EditEndorsement');

// QRs in the original user.questionResponses whose IDs aren't in newQuestionResponses are deleted
// QRs in the original whose IDs are are updated to the new content
// QRs in newQuestionResponses with no ID or new IDs are appended
const updateQuestionResponses = ({ newQuestionResponses, user, author }) => {
  const updatedUser = user; // no-param-reassign
  // get the string IDs of the content snippets (i.e. string IDs of boasts, or interests, or
  // vibes, etc. in the snippetsInput)
  const updateQR_ids = newQuestionResponses
    .filter(questionResponse => questionResponse._id)
    .map(questionResponse => questionResponse._id.toString());
  // remove snippets the author previously wrote that aren't in the above-generated list of
  // snippet IDs
  updatedUser.questionResponses = updatedUser.questionResponses
    .filter(questionResponse => (questionResponse.author_id.toString() !== author._id.toString())
      || updateQR_ids.includes(questionResponse._id.toString()));

  // for each snippet in the edit object, either edit an existing snippet with matching id, or
  // this is a new snippet so append it
  for (const questionResponse of newQuestionResponses) {
    let shouldAppend = true;
    for (const oldQuestionResponse of updatedUser.questionResponses) {
      if (oldQuestionResponse.author_id.toString() === author._id.toString()
        && questionResponse._id
        && oldQuestionResponse._id.toString() === questionResponse._id.toString()) {
        Object.assign(oldQuestionResponse, questionResponse);
        shouldAppend = false;
        break;
      }
    }
    if (shouldAppend) {
      updatedUser.questionResponses.push(questionResponse);
    }
  }
};

export const editEndorsementResolver = async ({ editEndorsementInput }) => {
  const now = new Date();
  const user = await User.findById(editEndorsementInput.user_id);
  const endorser = await User.findById(editEndorsementInput.endorser_id);
  if (!user || !endorser) {
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  if (!(user.endorser_ids
    .map(endorser_id => endorser_id.toString())
    .includes(endorser._id.toString()))) {
    return {
      success: false,
      message: WRONG_CREATOR_ERROR,
    };
  }
  if (editEndorsementInput.questionResponses) {
    updateQuestionResponses({
      newQuestionResponses: editEndorsementInput.questionResponses,
      user,
      author: endorser,
    });
  }
  user.questionResponsesCount = user.questionResponses.length;
  user.lastEditedTimes.push(now);
  user.lastEditedTimes = user.lastEditedTimes.slice(-1 * LAST_EDITED_ARRAY_LEN);
  try {
    const updatedUser = await user.save();
    // errorLog(updatedUser);
    return {
      success: true,
      user: updatedUser,
    };
  } catch (e) {
    errorLog(`error occurred editing endorsement: ${e}`);
    generateSentryErrorForResolver({
      resolverType: 'mutation',
      routeName: 'editEndorsement',
      args: { editEndorsementInput },
      errorMsg: e,
      errorName: EDIT_ENDORSEMENT_ERROR,
    });
    return {
      success: false,
      message: EDIT_ENDORSEMENT_ERROR,
    };
  }
};
