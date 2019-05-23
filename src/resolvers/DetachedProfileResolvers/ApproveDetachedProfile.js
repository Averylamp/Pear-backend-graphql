import nanoid from 'nanoid';
import { User } from '../../models/UserModel';
import {
  ALREADY_APPROVED_PROFILE,
  APPROVE_PROFILE_ERROR,
} from '../ResolverErrorStrings';
import { DetachedProfile } from '../../models/DetachedProfile';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import { LAST_EDITED_ARRAY_LEN, NEW_PROFILE_BONUS, regenTestDBMode } from '../../constants';
import {
  updateDiscoveryForUserById,
} from '../../discovery/DiscoverProfile';
import {
  createEndorsementChat,
  getChatDocPathFromId,
  sendNewEndorsementMessage, sendProfileApprovedPushNotification,
} from '../../FirebaseManager';
import { getAndValidateUsersAndDetachedProfileObjects } from './DetachedProfileResolverUtils';
import { generateSentryErrorForResolver } from '../../SentryHelper';
import { rollbackObject } from '../../../util/util';

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
  const oppositeDetachedProfile = await DetachedProfile
    .findOne({ creatorUser_id: user._id, phoneNumber: creator.phoneNumber });

  const initialUser = user.toObject();
  const initialCreator = creator.toObject();
  const initialDetachedProfile = detachedProfile.toObject();
  const initialOppositeDetachedProfile = oppositeDetachedProfile
    ? oppositeDetachedProfile.toObject() : null;

  // determine whether or not these users are already friends, and get or generate firebase chat id
  const endorsementEdge = user.endorsementEdges.find(
    edge => (edge.otherUser_id.toString() === creator._id.toString()),
  );
  const firebaseId = endorsementEdge ? endorsementEdge.firebaseChatDocumentID : nanoid(20);

  // get thumbnails and firstName
  for (const questionResponse of detachedProfile.questionResponses) {
    if (creator.firstName) {
      questionResponse.authorFirstName = creator.firstName;
    }
    if (creator.thumbnailURL) {
      questionResponse.authorThumbnailURL = creator.thumbnailURL;
    }
  }
  if (detachedProfile.bio) {
    if (creator.firstName) {
      detachedProfile.bio.authorFirstName = creator.firstName;
    }
    if (creator.thumbnailURL) {
      detachedProfile.bio.authorThumbnailURL = creator.thumbnailURL;
    }
  }

  // construct user update object
  const userObjectUpdate = {
    isSeeking: true,
    biosCount: user.bios.length + (detachedProfile.bio ? 1 : 0),
    questionResponsesCount: user.questionResponses.length
      + detachedProfile.questionResponses.length,
    $inc: { endorserCount: 1 },
    $push: {
      endorser_ids: creatorUser_id,
      questionResponses: { $each: detachedProfile.questionResponses },
      bios: {
        $each: detachedProfile.bio ? [detachedProfile.bio] : [],
      },
      lastEditedTimes: {
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

  // approve the opposite detached profile, if it exists
  if (oppositeDetachedProfile) {
    // creator object updates
    // get thumbnails and firstName
    for (const questionResponse of oppositeDetachedProfile.questionResponses) {
      if (user.firstName) {
        questionResponse.authorFirstName = user.firstName;
      }
      if (user.thumbnailURL) {
        questionResponse.authorThumbnailURL = user.thumbnailURL;
      }
    }
    if (oppositeDetachedProfile.bio) {
      if (user.firstName) {
        oppositeDetachedProfile.bio.authorFirstName = user.firstName;
      }
      if (creator.thumbnailURL) {
        oppositeDetachedProfile.bio.authorThumbnailURL = user.thumbnailURL;
      }
    }
    creatorObjectUpdate.biosCount = creator.bios.length + (oppositeDetachedProfile.bio ? 1 : 0);
    creatorObjectUpdate.questionResponsesCount = creator.questionResponses.length
      + oppositeDetachedProfile.questionResponses.length;
    creatorObjectUpdate.$push.endorser_ids = user_id;
    creatorObjectUpdate.$push.bios = {
      $each: oppositeDetachedProfile.bio ? [oppositeDetachedProfile.bio] : [],
    };
    creatorObjectUpdate.$push.questionResponses = {
      $each: oppositeDetachedProfile.questionResponses,
    };
    creatorObjectUpdate.$push.lastEditedTimes = {
      $each: [new Date()],
      $slice: -1 * LAST_EDITED_ARRAY_LEN,
    };
    creatorObjectUpdate.$inc.endorserCount = 1;

    // user object updates
    userObjectUpdate.$push.endorsedUser_ids = creatorUser_id;
    userObjectUpdate.$inc.endorserCount = 1;
    userObjectUpdate.$inc.detachedProfileCount = -1;

    // opposite detached profile updates
    oppositeDetachedProfile.status = 'accepted';
    oppositeDetachedProfile.endorsedUser_id = creatorUser_id;
    oppositeDetachedProfile.acceptedTime = new Date();
  }

  // construct the detached profile update object
  const detachedProfileUpdate = {
    status: 'accepted',
    endorsedUser_id: user_id,
    acceptedTime: new Date(),
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

  let oppositeDetachedProfilePromise = null;
  if (oppositeDetachedProfile) {
    oppositeDetachedProfilePromise = oppositeDetachedProfile.save().catch(err => err);
  }

  // create chat object
  const createChatPromise = endorsementEdge ? null : createEndorsementChat({
    documentID: firebaseId,
    firstPerson: user,
    secondPerson: creator,
  })
    .catch(err => err);

  return Promise.all([
    updateUserObjectPromise, updateCreatorObjectPromise,
    updateDetachedProfilePromise, createChatPromise, oppositeDetachedProfilePromise])
    .then(async ([
      updateUserObjectResult, updateCreatorObjectResult,
      updateDetachedProfileResult, createChatResult, oppositeDetachedProfileResult]) => {
      if (updateUserObjectResult instanceof Error
        || updateCreatorObjectResult instanceof Error
        || updateDetachedProfileResult instanceof Error
        || createChatResult instanceof Error
        || oppositeDetachedProfileResult instanceof Error) {
        errorLog('error attaching profile, rolling back');
        let errorMessage = '';
        if (updateUserObjectResult instanceof Error) {
          errorMessage += updateUserObjectResult.toString();
        }
        if (updateCreatorObjectResult instanceof Error) {
          errorMessage += updateCreatorObjectResult.toString();
        }
        if (updateDetachedProfileResult instanceof Error) {
          errorMessage += updateDetachedProfileResult.toString();
        }
        if (createChatResult instanceof Error) {
          errorMessage += createChatResult.toString();
        }
        if (oppositeDetachedProfileResult instanceof Error) {
          errorMessage += oppositeDetachedProfileResult.toString();
        }
        await rollbackObject({
          model: User,
          object_id: user_id,
          initialObject: initialUser,
          onSuccess: () => { debug('rolled back user object successfully'); },
          onFailure: (err) => { errorLog(`error rolling back user object: ${err}`); },
        });
        await rollbackObject({
          model: User,
          object_id: creatorUser_id,
          initialObject: initialCreator,
          onSuccess: () => { debug('rolled back creator object successfully'); },
          onFailure: (err) => { errorLog(`error rolling back creator object: ${err}`); },
        });
        await rollbackObject({
          model: DetachedProfile,
          object_id: detachedProfile_id,
          initialObject: initialDetachedProfile,
          onSuccess: () => { debug('rolled back detachedProfile object successfully'); },
          onFailure: (err) => { errorLog(`error rolling back detachedProfile object: ${err}`); },
        });
        if (oppositeDetachedProfile) {
          await rollbackObject({
            model: DetachedProfile,
            object_id: oppositeDetachedProfile._id.toString(),
            initialObject: initialOppositeDetachedProfile,
            onSuccess: () => { debug('rolled back opposite detachedProfile object successfully'); },
            onFailure: (err) => {
              errorLog(`error rolling back opposite detachedProfile object: ${err}`);
            },
          });
        }
        errorLog(errorMessage);
        generateSentryErrorForResolver({
          resolverType: 'mutation',
          routeName: 'approveDetachedProfileInput',
          args: { approveDetachedProfileInput },
          errorMsg: errorMessage,
          errorName: APPROVE_PROFILE_ERROR,
        });
        return {
          success: false,
          message: APPROVE_PROFILE_ERROR,
        };
      }
      // all operations succeeded; populate discovery feeds if this the endorsee's first profile
      try {
        const feed = await DiscoveryQueue.findById(user.discoveryQueue_id);
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
