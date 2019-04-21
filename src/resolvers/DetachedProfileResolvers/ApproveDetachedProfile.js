import nanoid from 'nanoid';
import { User } from '../../models/UserModel';
import {
  ALREADY_APPROVED_PROFILE,
  APPROVE_PROFILE_ERROR,
} from '../ResolverErrorStrings';
import { DetachedProfile } from '../../models/DetachedProfile';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import { LAST_EDITED_ARRAY_LEN, NEW_PROFILE_BONUS } from '../../constants';
import {
  updateDiscoveryForUserById,
} from '../../discovery/DiscoverProfile';
import {
  createEndorsementChat,
  getChatDocPathFromId,
  sendNewEndorsementMessage, sendProfileApprovedPushNotification,
} from '../../FirebaseManager';
import { getAndValidateUsersAndDetachedProfileObjects } from './DetachedProfileResolverUtils';

const debug = require('debug')('dev:DetachedProfileResolvers');
const errorLog = require('debug')('error:DetachedProfileResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');

export const approveDetachedProfileResolver = async ({ approveDetachedProfileInput }) => {
  functionCallConsole('Approve Profile Called');

  const { user_id, detachedProfile_id, creatorUser_id } = approveDetachedProfileInput;
  // validate that users + detached profile exist, and get the objects
  let user = null;
  let detachedProfile = null;
  let creator = null;
  try {
    ({ user, detachedProfile, creator } = await getAndValidateUsersAndDetachedProfileObjects(
      {
        user_id,
        detachedProfile_id,
        creator_id: creatorUser_id,
      },
    ));
  } catch (e) {
    errorLog(`Error occurred validating dp and user objs: ${e}`);
    return {
      success: false,
      message: APPROVE_PROFILE_ERROR,
    };
  }
  if (user.endorser_ids.map(endorser_id => endorser_id.toString())
    .includes(creatorUser_id.toString())) {
    return {
      success: false,
      message: ALREADY_APPROVED_PROFILE,
    };
  }
  const initialUser = user.toObject();
  const initialCreator = creator.toObject();
  const initialDetachedProfile = detachedProfile.toObject();

  // determine whether or not these users are already friends, and get or generate firebase chat id
  const endorsementEdge = user.endorsementEdges.find(
    edge => (edge.otherUser_id.toString() === creator._id.toString()),
  );
  const firebaseId = endorsementEdge ? endorsementEdge.firebaseChatDocumentID : nanoid(20);

  // construct user update object
  const userObjectUpdate = {
    isSeeking: true,
    $inc: { endorserCount: 1 },
    $push: {
      endorser_ids: creatorUser_id,
      bankImages: {
        $each: detachedProfile.images,
      },
      boasts: { $each: approveDetachedProfileInput.boasts },
      roasts: { $each: approveDetachedProfileInput.roasts },
      questionResponses: { $each: approveDetachedProfileInput.questionResponses },
      vibes: { $each: approveDetachedProfileInput.vibes },
      bios: { $each: approveDetachedProfileInput.bio ? [approveDetachedProfileInput.bio] : [] },
      dos: { $each: approveDetachedProfileInput.dos ? approveDetachedProfileInput.dos : [] },
      donts: { $each: approveDetachedProfileInput.donts ? approveDetachedProfileInput.donts : [] },
      interests: {
        $each: approveDetachedProfileInput.interests ? approveDetachedProfileInput.interests : [],
      },
      lastEdited: {
        $each: [new Date()],
        $slice: -1 * LAST_EDITED_ARRAY_LEN,
      },
    },
  };
  if (!endorsementEdge) {
    userObjectUpdate.$push.endorsementEdges = {
      otherUser_id: creator._id,
      firebaseChatDocumentID: firebaseId,
      firebaseChatDocumentPath: getChatDocPathFromId(firebaseId),
    };
  }

  // construct creator update object
  const creatorObjectUpdate = {
    $pull: {
      detachedProfile_ids: detachedProfile_id,
    },
    $push: {
      endorsedUser_ids: user_id,
    },
    $inc: {
      detachedProfilesCount: -1,
      endorsedUsersCount: 1,
    },
  };
  if (!endorsementEdge) {
    creatorObjectUpdate.$push.endorsementEdges = {
      otherUser_id: user._id,
      firebaseChatDocumentID: firebaseId,
      firebaseChatDocumentPath: getChatDocPathFromId(firebaseId),
    };
  }

  // construct the detached profile update object
  const detachedProfileUpdate = {
    status: 'accepted',
    endorsedUser_id: user_id,
  };

  // execute user object update
  const updateUserObjectPromise = User
    .findByIdAndUpdate(user_id, userObjectUpdate, { new: true })
    .exec()
    .catch(err => err);

  // execute creator object update
  const updateCreatorObjectPromise = User
    .findByIdAndUpdate(creatorUser_id, creatorObjectUpdate, { new: true })
    .exec()
    .catch(err => err);

  // execute detached profile object update
  const updateDetachedProfilePromise = DetachedProfile
    .findByIdAndUpdate(detachedProfile_id, detachedProfileUpdate, { new: true })
    .exec()
    .catch(err => err);

  // create chat object
  const createChatPromise = endorsementEdge ? null : createEndorsementChat({
    documentID: firebaseId,
    firstPerson: user,
    secondPerson: creator,
  })
    .catch(err => err);

  return Promise.all([
    updateUserObjectPromise, updateCreatorObjectPromise,
    updateDetachedProfilePromise, createChatPromise])
    .then(async ([
      updateUserObjectResult, updateCreatorObjectResult,
      updateDetachedProfileResult, createChatResult]) => {
      if (updateUserObjectResult instanceof Error
        || updateCreatorObjectResult instanceof Error
        || updateDetachedProfileResult instanceof Error
        || createChatResult instanceof Error) {
        errorLog('error attaching profile, rolling back');
        let errorMessage = '';
        if (updateUserObjectResult instanceof Error) {
          errorMessage += updateUserObjectResult.toString();
        } else {
          await User.findByIdAndUpdate(user_id, initialUser, {
            new: true,
            overwrite: true,
          })
            .then(() => {
              debug('rolled back user object successfully');
            })
            .catch((err) => {
              errorLog(`error rolling back user object: ${err}`);
            });
        }

        if (updateCreatorObjectResult instanceof Error) {
          errorMessage += updateCreatorObjectResult.toString();
        } else {
          await User.findByIdAndUpdate(creatorUser_id, initialCreator, {
            new: true,
            overwrite: true,
          })
            .then(() => {
              debug('rolled back creator object successfully');
            })
            .catch((err) => {
              errorLog(`error rolling back creator object: ${err}`);
            });
        }

        if (updateDetachedProfileResult instanceof Error) {
          errorMessage += updateDetachedProfileResult.toString();
        } else {
          await DetachedProfile.findByIdAndUpdate(detachedProfile_id, initialDetachedProfile, {
            new: true,
            overwrite: true,
          })
            .then(() => {
              debug('rolled back detachedProfile object successfully');
            })
            .catch((err) => {
              errorLog(`error rolling back detachedProfile object: ${err}`);
            });
        }

        if (createChatResult instanceof Error) {
          errorMessage += createChatResult.toString();
        } else {
          // don't do anything
        }

        errorLog(errorMessage);
        return {
          success: false,
          message: APPROVE_PROFILE_ERROR,
        };
      }
      // all operations succeeded; populate discovery feeds if this the endorsee's first profile
      try {
        const feed = await DiscoveryQueue.findById(user.discoveryQueue_id);
        const devMode = process.env.DEV === 'true';
        const regenTestDBMode = (process.env.REGEN_DB === 'true' && devMode);
        if (feed.currentDiscoveryItems.length === 0 && !regenTestDBMode) {
          for (let i = 0; i < NEW_PROFILE_BONUS; i += 1) {
            await updateDiscoveryForUserById({ user_id });
          }
        }
      } catch (e) {
        errorLog(`error occurred when trying to populate discovery feed: ${e}`);
        debug(`error occurred when trying to populate discovery feed: ${e}`);
      }
      // send the server message to the endorsement chat. it's mostly ok if this silent fails
      // so we don't do the whole rollback thing
      sendNewEndorsementMessage({
        chatID: firebaseId,
        endorser: creator,
        endorsee: user,
      });
      // send a push notification. not a big deal if this silent fails also
      sendProfileApprovedPushNotification({
        creator,
        user,
      });
      return {
        success: true,
        user: updateUserObjectResult,
      };
    });
};
