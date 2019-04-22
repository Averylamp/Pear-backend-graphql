import { User } from '../../models/UserModel';
import {
  EDIT_ENDORSEMENT_ERROR,
  GET_USER_ERROR, WRONG_CREATOR_ERROR,
} from '../ResolverErrorStrings';
import { LAST_EDITED_ARRAY_LEN } from '../../constants';

const errorLog = require('debug')('error:EditEndorsement');

// updates the field "contentKeyName" of the user object, given a snippetsInput provided by author
// the snippetsInput has a field "contentKeyName" which is an array of content snippets, i.e.
// boasts, roasts, dos, donts.
// this function is a sort of abstract, so an example of the logic for 'boasts' specifically is
// provided below
const updateArrayContentSnippet = ({
  contentKeyName, snippetsInput, user, author,
}) => {
  // linter complains if we try to modify a param, but this is exactly what we want this function
  // to do, so this is a workaround
  const updateUser = user;
  if (snippetsInput[contentKeyName]) {
    // get the string IDs of the content snippets (i.e. string IDs of boasts, or interests, or
    // vibes, etc. in the snippetsInput)
    const updateSnippet_ids = snippetsInput[contentKeyName]
      .filter(snippet => snippet._id)
      .map(snippet => snippet._id.toString());
    // remove snippets the author previously wrote that aren't in the above-generated list of
    // snippet IDs
    updateUser[contentKeyName] = updateUser[contentKeyName]
      .filter(snippet => (snippet.author_id.toString() !== author._id.toString())
        || updateSnippet_ids.includes(snippet._id.toString()));

    // for each snippet in the edit object, either edit an existing snippet with matching id, or
    // this is a new snippet so append it
    for (const snippet of snippetsInput[contentKeyName]) {
      let shouldAppend = true;
      for (const existingSnippet of updateUser[contentKeyName]) {
        if (existingSnippet.author_id.toString() === author._id.toString()
          && snippet._id
          && existingSnippet._id.toString() === snippet._id.toString()) {
          Object.assign(existingSnippet, snippet);
          shouldAppend = false;
          break;
        }
      }
      if (shouldAppend) {
        updateUser[contentKeyName].push(snippet);
      }
    }
  }

  // here's what the logic looks like for just boasts:
  /*
  if (editEndorsementInput.boasts) {
    // remove boasts endorser previously wrote that dont match any input boast ids
    const updateBoast_ids = editEndorsementInput.boasts
      .filter(boast => boast._id)
      .map(boast => boast._id.toString());
    user.boasts = user.boasts
      .filter(boast => (boast.author_id.toString() !== endorser._id.toString())
        || updateBoast_ids.includes(boast._id.toString()));

    // for each boast in the edit object, either edit an existing boast object if ids match, or else
    // append
    for (const boast of editEndorsementInput.boasts) {
      let shouldAppend = true;
      for (const existingBoast of user.boasts) {
        if (existingBoast.author_id.toString() === endorser._id.toString()
          && boast._id
          && existingBoast._id.toString() === boast._id.toString()) {
          Object.assign(existingBoast, boast);
          shouldAppend = false;
          break;
        }
      }
      if (shouldAppend) {
        user.boasts.push(boast);
      }
    }
  }
   */
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
  // boasts etc. are passed in as arrays, so use updateArrayContentSnippet to update
  const contentKeyNames = ['boasts', 'roasts', 'dos', 'donts', 'vibes', 'interests'];
  for (const contentKeyName of contentKeyNames) {
    updateArrayContentSnippet({
      contentKeyName,
      snippetsInput: editEndorsementInput,
      user,
      author: endorser,
    });
  }
  // if bio is passed in it's a single object, so update or append the bio
  if (editEndorsementInput.bio) {
    let shouldAppend = true;
    for (const existingBio of user.bios) {
      if (existingBio.author_id.toString() === endorser._id.toString()) {
        Object.assign(existingBio, editEndorsementInput.bio);
        shouldAppend = false;
      }
    }
    if (shouldAppend) {
      user.bios.push(editEndorsementInput.bio);
    }
  }
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
    return {
      success: false,
      message: EDIT_ENDORSEMENT_ERROR,
    };
  }
};
