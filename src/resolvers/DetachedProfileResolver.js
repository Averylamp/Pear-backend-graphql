import nanoid from 'nanoid';
import { pick } from 'lodash';
import { DetachedProfile, createDetachedProfileObject } from '../models/DetachedProfile';
import { User } from '../models/UserModel';
import { createUserProfileObject, UserProfile } from '../models/UserProfileModel';
import { updateDiscoveryWithNextItem } from '../discovery/DiscoverProfile';
import { INITIALIZED_FEED_LENGTH } from '../constants';
import { DiscoveryQueue } from '../models/DiscoveryQueueModel';
import {
  createEndorsementChat,
  getChatDocPathFromId,
  sendNewEndorsementMessage,
} from '../FirebaseManager';
import {
  ALREADY_MADE_PROFILE,
  APPROVE_PROFILE_ERROR, CANT_ENDORSE_YOURSELF,
  CREATE_DETACHED_PROFILE_ERROR,
  GET_USER_ERROR, VIEW_DETACHED_PROFILE_ERROR,
} from './ResolverErrorStrings';

const mongoose = require('mongoose');
const debug = require('debug')('dev:DetachedProfileResolvers');
const errorLog = require('debug')('error:DetachedProfileResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');

const canMakeProfileForSelf = [
  '9738738225',
  '2067789236',
  '6196160848',
];

const getAndValidateUsersAndDetachedProfileObjects = async ({
  user_id, detachedProfile_id, creator_id,
}) => {
  const userPromise = User.findById(user_id)
    .exec()
    .catch(() => null);
  const detachedProfilePromise = DetachedProfile.findById(detachedProfile_id)
    .exec()
    .catch(() => null);
  const [user, detachedProfile] = await Promise.all([
    userPromise,
    detachedProfilePromise]);
  if (!user) {
    errorLog(`Couldn't find user with id ${user_id}`);
    throw new Error(`Couldn't find user with id ${user_id}`);
  }
  if (!detachedProfile) {
    errorLog(`Couldn't find detached profile with id ${detachedProfile_id}`);
    throw new Error(`Couldn't find detached profile with id ${detachedProfile_id}`);
  }
  // check that this user is indeed the user referenced by the detached profile
  if (user.phoneNumber !== detachedProfile.phoneNumber) {
    errorLog(`user phone number is ${user.phoneNumber}`);
    errorLog(`detached profile phone number is ${detachedProfile.phoneNumber}`);
    errorLog(
      `Detached profile with phone number ${detachedProfile.phoneNumber} can't be viewed by this user`,
    );
    throw new Error(
      `Detached profile with phone number ${detachedProfile.phoneNumber} can't be viewed by this user`,
    );
  }
  let creator = null;
  if (creator_id) {
    creator = await User.findById(creator_id)
      .exec()
      .catch(() => null);
    if (!creator) {
      errorLog(`Couldn't find creator with id ${creator_id}`);
      throw new Error(`Couldn't find creator with id ${creator_id}`);
    }

    // check that creator made detached profile
    if (creator_id !== detachedProfile.creatorUser_id.toString()) {
      errorLog(`Creator with id ${creator_id} did not make detached profile ${detachedProfile_id}`);
      throw new Error(
        `Creator with id ${creator_id} did not make detached profile ${detachedProfile_id}`,
      );
    }
    // check creator != user
    if (creator_id === user_id) {
      if (process.env.DB_NAME !== 'prod'
        && canMakeProfileForSelf.includes(detachedProfile.phoneNumber)) {
        // we ignore this check if phoneNumber is whitelisted and we aren't touching prod db
      } else {
        errorLog(`Endorsed user with id ${user_id} is same as profile creator`);
        throw new Error(`Endorsed user with id ${user_id} is same as profile creator`);
      }
    }
    // check creator has not already made a profile for user
    const endorserIDs = await UserProfile.find({ user_id });
    if (detachedProfile.creatorUser_id in endorserIDs) {
      errorLog(`creator ${creator_id} has already made a profile for user ${user_id}`);
      throw new Error(`creator ${creator_id} has already made a profile for user ${user_id}`);
    }
  }
  return {
    user,
    detachedProfile,
    creator,
  };
};

export const resolvers = {
  Query: {
    findDetachedProfiles: async (_, { phoneNumber }) => {
      functionCallConsole('Find Detached Profile Called');
      debug(`Looking for detached profiles for: ${phoneNumber}`);
      return DetachedProfile.find({
        phoneNumber,
        status: {
          $ne: 'accepted',
        },
      });
    },
  },
  DetachedProfile: {
    creatorUser: async ({ creatorUser_id }) => User.findById(creatorUser_id),
    userProfile: async ({ userProfile_id }) => UserProfile.findById(userProfile_id),
  },
  Mutation: {
    createDetachedProfile: async (_, { detachedProfileInput }) => {
      functionCallConsole('Create Detached Profile Called');

      // create input object
      const detachedProfileID = '_id' in detachedProfileInput
        ? detachedProfileInput._id : mongoose.Types.ObjectId();
      const finalDetachedProfileInput = pick(detachedProfileInput, [
        'creatorUser_id',
        'creatorFirstName',
        'firstName',
        'phoneNumber',
        'age',
        'gender',
        'interests',
        'vibes',
        'bio',
        'dos',
        'donts',
        'images',
        'matchingDemographics',
        'matchingPreferences',
      ]);
      finalDetachedProfileInput._id = detachedProfileID;
      const locationObj = {
        point: {
          coordinates: detachedProfileInput.location,
        },
      };
      finalDetachedProfileInput.matchingDemographics = {
        location: locationObj,
        gender: detachedProfileInput.gender,
        age: detachedProfileInput.age,
      };
      finalDetachedProfileInput.matchingPreferences = {
        location: locationObj,
        minAgeRange: Math.max(detachedProfileInput.age - 3, 18),
        maxAgeRange: Math.min(detachedProfileInput.age + 3, 100),
      };
      if (detachedProfileInput.locationName) {
        finalDetachedProfileInput.matchingDemographics.locationName = {
          name: detachedProfileInput.locationName,
        };
        finalDetachedProfileInput.matchingPreferences.locationName = {
          name: detachedProfileInput.locationName,
        };
      }

      // perform validation
      const { creatorUser_id } = detachedProfileInput;
      const creator = await User.findById(creatorUser_id)
        .exec()
        .catch(err => err);
      if (!creator) {
        return {
          success: false,
          message: GET_USER_ERROR,
        };
      }
      try {
        const creatorDetachedProfilesPromise = DetachedProfile.find({ creatorUser_id })
          .exec();
        const creatorAttachedProfilesPromise = UserProfile.find({ creatorUser_id })
          .exec();
        const [creatorDetachedProfiles, creatorAttachedProfiles] = await Promise.all(
          [creatorDetachedProfilesPromise, creatorAttachedProfilesPromise],
        );
        const dpPhoneNumbers = creatorDetachedProfiles.map(dp => dp.phoneNumber);
        const apPhoneNumbers = creatorAttachedProfiles.map(ap => ap.phoneNumber);
        if (detachedProfileInput.phoneNumber === creator.phoneNumber) {
          if (process.env.DB_NAME !== 'prod'
            && canMakeProfileForSelf.includes(creator.phoneNumber)) {
            // we ignore this check if phoneNumber is whitelisted and we aren't touching prod db
          } else {
            return {
              success: false,
              message: CANT_ENDORSE_YOURSELF,
            };
          }
        }
        if (dpPhoneNumbers.includes(detachedProfileInput.phoneNumber)) {
          return {
            success: false,
            message: ALREADY_MADE_PROFILE,
          };
        }
        if (apPhoneNumbers.includes(detachedProfileInput.phoneNumber)) {
          return {
            success: false,
            message: ALREADY_MADE_PROFILE,
          };
        }
      } catch (e) {
        return {
          success: false,
          message: CREATE_DETACHED_PROFILE_ERROR,
        };
      }

      // update creator's user object
      const updateCreatorUserObject = User.findByIdAndUpdate(creatorUser_id, {
        $push: {
          detachedProfile_ids: detachedProfileID,
        },
      }, { new: true })
        .exec()
        .catch(err => err);

      // create new detached profile
      const createDetachedProfileObj = createDetachedProfileObject(finalDetachedProfileInput)
        .catch(err => err);

      // TODO: should also check if updateCreatorUserObject instanceof Error
      return Promise.all([updateCreatorUserObject, createDetachedProfileObj])
        .then(async ([newUser, detachedProfileObject]) => {
          if (newUser == null || detachedProfileObject instanceof Error) {
            let errorMessage = '';
            if (newUser == null) {
              errorMessage += 'Was unable to add Detached Profile to User\n';
            }
            if (detachedProfileObject instanceof Error) {
              errorMessage += 'Was unable to create Detached Profile Object';
              if (newUser) {
                User.findByIdAndUpdate(creatorUser_id, {
                  $pull: {
                    detachedProfile_ids: detachedProfileID,
                  },
                }, { new: true }, (err) => {
                  if (err) {
                    debug('Failed to remove Detached Profile ID from user');
                  } else {
                    debug('Successfully removed Detached Profile ID from user');
                  }
                });
              }
            } else {
              detachedProfileObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove discovery object${err}`);
                } else {
                  debug('Removed created discovery object successfully');
                }
              });
            }
            debug('Completed unsuccessfully');
            errorLog(errorMessage);
            return {
              success: false,
              message: CREATE_DETACHED_PROFILE_ERROR,
            };
          }
          debug('Completed successfully');
          // populate creator's feed if feed is empty (i.e. this is the first profile they've made)
          try {
            const feed = await DiscoveryQueue.findById(creator.discoveryQueue_id);
            const devMode = process.env.DEV === 'true';
            const regenTestDBMode = (process.env.REGEN_DB === 'true' && devMode);
            if (feed.currentDiscoveryItems.length === 0 && !regenTestDBMode) {
              for (let i = 0; i < INITIALIZED_FEED_LENGTH; i += 1) {
                await updateDiscoveryWithNextItem({ userObj: newUser });
              }
            }
          } catch (e) {
            debug(`error occurred when trying to populate discovery feed: ${e}`);
          }
          return {
            success: true,
            detachedProfile: detachedProfileObject,
          };
        });
    },
    viewDetachedProfile: async (_source, { user_id, detachedProfile_id }) => {
      functionCallConsole('View Detached Profile Called');

      try {
        await getAndValidateUsersAndDetachedProfileObjects({
          user_id,
          detachedProfile_id,
        });

        const updatedDetachedProfile = await DetachedProfile
          .findByIdAndUpdate(detachedProfile_id, {
            status: 'waitingSeen',
          }, { new: true })
          .exec();
        return {
          success: true,
          detachedProfile: updatedDetachedProfile,
        };
      } catch (e) {
        errorLog(`An error occurred viewing detached profile: ${e}`);
        return {
          success: false,
          message: VIEW_DETACHED_PROFILE_ERROR,
        };
      }
    },
    approveNewDetachedProfile: async (_source, { user_id, detachedProfile_id, creatorUser_id }) => {
      functionCallConsole('Approve Profile Called');

      const { user, detachedProfile, creator } = await getAndValidateUsersAndDetachedProfileObjects(
        {
          user_id,
          detachedProfile_id,
          creator_id: creatorUser_id,
        },
      );
      const profileId = mongoose.Types.ObjectId();
      const userProfileInput = {
        _id: profileId,
        creatorUser_id: creator._id,
        creatorFirstName: creator.firstName,
        user_id,
        interests: detachedProfile.interests,
        vibes: detachedProfile.vibes,
        bio: detachedProfile.bio,
        dos: detachedProfile.dos,
        donts: detachedProfile.donts,
      };

      const userObjectUpdate = {
        isSeeking: true,
        $inc: { profileCount: 1 },
        $push: {
          profile_ids: profileId,
          bankImages: {
            $each: detachedProfile.images,
          },
        },
      };

      let userUpdateArrayFilters = [];

      const creatorObjectUpdate = {
        $pull: {
          detachedProfile_ids: detachedProfile_id,
        },
        $push: {
          endorsedProfile_ids: profileId,
        },
      };
      let creatorUpdateArrayFilters = [];

      // generate a tentative firebase ID, to update the edges and userProfile with if one doesn't
      // already exist
      let firebaseId = nanoid(20);
      const endorsementEdge = user.endorsementEdges.find(
        edge => (edge.otherUser_id.toString() === creator._id.toString()),
      );
      if (!endorsementEdge) {
        userObjectUpdate.$push.endorsementEdges = {
          otherUser_id: creator._id,
          myProfile_id: profileId,
          firebaseChatDocumentID: firebaseId,
          firebaseChatDocumentPath: getChatDocPathFromId(firebaseId),
        };
        creatorObjectUpdate.$push.endorsementEdges = {
          otherUser_id: user._id,
          theirProfile_id: profileId,
          firebaseChatDocumentID: firebaseId,
          firebaseChatDocumentPath: getChatDocPathFromId(firebaseId),
        };
      } else {
        userObjectUpdate['endorsementEdges.$[element].myProfile_id'] = profileId;
        creatorObjectUpdate['endorsementEdges.$[element].theirProfile_id'] = profileId;
        userUpdateArrayFilters = [{ 'element.otherUser_id': creator._id.toString() }];
        creatorUpdateArrayFilters = [{ 'element.otherUser_id': user._id.toString() }];
        firebaseId = endorsementEdge.firebaseChatDocumentID;
      }

      userProfileInput.firebaseChatDocumentID = firebaseId;
      userProfileInput.firebaseChatDocumentPath = getChatDocPathFromId(firebaseId);
      // create new user profile
      const createUserProfileObjectPromise = createUserProfileObject(userProfileInput)
        .catch(err => err);

      // link to first party, add photos to photobank
      const updateUserObjectPromise = User
        .findByIdAndUpdate(user_id, userObjectUpdate, {
          new: true,
          arrayFilters: userUpdateArrayFilters,
        })
        .exec()
        .catch(err => err);

      // unlink detached profile from creator, link new endorsed profile
      const updateCreatorObjectPromise = User
        .findByIdAndUpdate(creator._id, creatorObjectUpdate, {
          new: true,
          arrayFilters: creatorUpdateArrayFilters,
        })
        .exec()
        .catch(err => err);

      // update status of detached profile
      const updateDetachedProfilePromise = DetachedProfile.findByIdAndUpdate(detachedProfile_id, {
        status: 'accepted',
        userProfile_id: profileId,
      })
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
        createUserProfileObjectPromise, updateUserObjectPromise,
        updateCreatorObjectPromise, updateDetachedProfilePromise, createChatPromise])
        .then(async ([
          createUserProfileObjectResult, updateUserObjectResult,
          updateCreatorObjectResult, updateDetachedProfileResult, createChatResult]) => {
          // if at least one of the above four operations failed, roll back the others
          if (createUserProfileObjectResult instanceof Error
            || updateUserObjectResult instanceof Error
            || updateCreatorObjectResult instanceof Error
            || updateDetachedProfileResult instanceof Error
            || createChatResult instanceof Error) {
            debug('error attaching profile, rolling back');
            let errorMessage = '';
            if (createUserProfileObjectResult instanceof Error) {
              errorMessage += createUserProfileObjectResult.toString();
            } else {
              createUserProfileObjectResult.remove((err) => {
                if (err) {
                  errorLog(`Failed to remove user profile object: ${err}`);
                  debug(`Failed to remove user profile object: ${err}`);
                } else {
                  debug('Removed created user profile object successfully');
                }
              });
            }
            if (updateUserObjectResult instanceof Error) {
              errorMessage += updateUserObjectResult.toString();
            } else {
              let arrayFilters = [];
              const userUpdateRollback = {
                $inc: { profileCount: -1 },
                $pull: {
                  profile_ids: profileId,
                  bankImages: {
                    uploadedByUser_id: creator._id,
                  },
                },
              };
              if (!endorsementEdge) {
                // we created an edge, so remove the edge
                userUpdateRollback.$pull.endorsementEdges = {
                  otherUser_id: creator._id,
                };
              } else {
                // remove the reference to user's profile
                userUpdateRollback['endorsementEdges.$[element].myProfile_id'] = undefined;
                arrayFilters = [{ 'element.otherUser_id': creator._id.toString() }];
              }
              User.findByIdAndUpdate(user_id, userUpdateRollback, {
                new: true,
                arrayFilters,
              }, (err) => {
                if (err) {
                  errorLog(`Failed to rollback user updates: ${err}`);
                  debug(`Failed to rollback user updates: ${err}`);
                } else {
                  debug('Rolled back user updates successfully');
                }
              });
            }
            if (updateCreatorObjectResult instanceof Error) {
              errorMessage += updateCreatorObjectResult.toString();
            } else {
              let arrayFilters = [];
              const creatorUpdateRollback = {
                $push: {
                  detachedProfile_ids: detachedProfile_id,
                },
                $pull: {
                  endorsedProfile_ids: profileId,
                },
              };
              if (!endorsementEdge) {
                // we created an edge, so remove the edge
                creatorUpdateRollback.$pull.endorsementEdges = {
                  otherUser_id: user._id,
                };
              } else {
                // remove the reference to the user's profile
                creatorUpdateRollback['endorsementEdges.$[element].theirProfile_id'] = undefined;
                arrayFilters = [{ 'element.otherUser_id': user._id.toString() }];
              }
              User.findByIdAndUpdate(creator._id.toString(), creatorUpdateRollback, {
                new: true,
                arrayFilters,
              }, (err) => {
                if (err) {
                  errorLog(`Failed to roll back creator object: ${err}`);
                  debug(`Failed to roll back creator object: ${err}`);
                } else {
                  debug('Rolled back creator object successfully');
                }
              });
            }
            if (updateDetachedProfileResult instanceof Error) {
              errorMessage += updateDetachedProfileResult.toString();
            } else {
              DetachedProfile.findByIdAndUpdate(detachedProfile_id, {
                status: 'waitingSeen',
                $unset: {
                  userProfile_id: 1,
                },
              })
                .exec()
                .then(() => {
                  debug('Rolled back detached profile object successfully');
                })
                .catch((err) => {
                  errorLog(`Failed to roll back detached profile ${err}`);
                  debug(`Failed to roll back detached profile ${err}`);
                });
            }
            if (createChatResult instanceof Error) {
              errorMessage += createChatResult.toString();
            } else if (!endorsementEdge) {
              // TODO: decide if we want to actually delete the chat, or just de-reference
              // i.e. at this point, mongo contains no references to the chat anymore
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
              for (let i = 0; i < INITIALIZED_FEED_LENGTH; i += 1) {
                await updateDiscoveryWithNextItem({ userObj: updateCreatorObjectResult });
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
          return {
            success: true,
            user: updateUserObjectResult,
          };
        });
    },

  },
};
