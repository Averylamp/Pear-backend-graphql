import { pick } from 'lodash';
import { DetachedProfile, createDetachedProfileObject } from '../models/DetachedProfile';
import { User } from '../models/UserModel';
import { createUserProfileObject, UserProfile } from '../models/UserProfileModel';
import { updateDiscoveryWithNextItem } from '../discovery/DiscoverProfile';
import { INITIALIZED_FEED_LENGTH } from '../constants';
import { DiscoveryQueue } from '../models/DiscoveryQueueModel';

const mongoose = require('mongoose');
const debug = require('debug')('dev:DetachedProfileResolvers');
const errorLog = require('debug')('error:DetachedProfileResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');

export const resolvers = {
  Query: {
    findDetachedProfiles: async (_, { phoneNumber }) => {
      functionCallConsole('Find Detached Profile Called');
      debug(`Looking for detached profiles for: ${phoneNumber}`);
      return DetachedProfile.find({ phoneNumber });
    },
  },
  DetachedProfile: {
    creatorUser: async ({ creatorUser_id }) => User.findById(creatorUser_id),
  },
  Mutation: {
    createDetachedProfile: async (_, { detachedProfileInput }) => {
      functionCallConsole('Create Detached Profile Called');

      const detachedProfileID = '_id' in detachedProfileInput
        ? detachedProfileInput._id : mongoose.Types.ObjectId();
      const finalDetachedProfileInput = detachedProfileInput;
      finalDetachedProfileInput._id = detachedProfileID;

      const { creatorUser_id } = detachedProfileInput;
      const creator = await User.findById(creatorUser_id);
      if (!creator) {
        return {
          success: false,
          message: `Could not find creator with id ${creatorUser_id}`,
        };
      }

      const updateCreatorUserObject = User.findByIdAndUpdate(creatorUser_id, {
        $push: {
          detachedProfile_ids: detachedProfileID,
        },
      }, { new: true }).exec().catch(err => err);

      const createDetachedProfileObj = createDetachedProfileObject(finalDetachedProfileInput)
        .catch(err => err);

      return Promise.all([updateCreatorUserObject, createDetachedProfileObj])
        .then(async ([newUser, detachedProfileObject]) => {
          if (newUser == null || detachedProfileObject instanceof Error) {
            let message = '';
            if (newUser == null) {
              message += 'Was unable to add Detached Profile to User\n';
            }
            if (detachedProfileObject instanceof Error) {
              message += 'Was unable to create Detached Profile Object';
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
            return {
              success: false,
              message,
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
    // TODO: create a chat document in firebase between creator and user if none exists already
    approveNewDetachedProfile: async (_source, { user_id, detachedProfile_id, creatorUser_id }) => {
      functionCallConsole('Approve Profile Called');

      // check that user, detached profile, creator exist
      const userPromise = User.findById(user_id).exec()
        .catch(() => null);
      const detachedProfilePromise = DetachedProfile.findById(detachedProfile_id).exec()
        .catch(() => null);
      const creatorPromise = User.findById(creatorUser_id).exec()
        .catch(() => null);
      const [user, detachedProfile, creator] = await Promise.all([userPromise,
        detachedProfilePromise, creatorPromise]);
      if (!user) {
        return {
          success: false,
          message: `Could not find user with id ${user_id}`,
        };
      }
      if (!detachedProfile) {
        return {
          success: false,
          message: `Could not find detached profile with id ${detachedProfile_id}`,
        };
      }
      if (!creator) {
        return {
          success: false,
          message: `Could not find creator with id ${detachedProfile.creatorUser_id}`,
        };
      }

      // check that creator made detached profile
      if (creatorUser_id !== detachedProfile.creatorUser_id.toString()) {
        return {
          success: false,
          message: `${creatorUser_id} is not creator of detached profile ${detachedProfile_id}`,
        };
      }
      // check creator != user
      if (creatorUser_id === user_id && detachedProfile.phoneNumber !== '9738738225') {
        return {
          success: false,
          message: 'Can\'t create profile for yourself',
        };
      }
      // check creator has not already made a profile for user
      const endorserIDs = await UserProfile.find({ user_id });
      if (detachedProfile.creatorUser_id in endorserIDs) {
        return {
          success: false,
          message: `User already has a profile created by ${detachedProfile.creatorUser_id}`,
        };
      }
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

      // create new user profile
      const createUserProfileObjectePromise = createUserProfileObject(userProfileInput)
        .catch(err => err);

      let userObjectUpdate = {
        isSeeking: true,
        $inc: { profileCount: 1 },
        $push: {
          profile_ids: profileId,
          bankImages: {
            $each: detachedProfile.images,
          },
        },
      };

      if (user.displayedImages.length < 6) {
        userObjectUpdate = {
          isSeeking: true,
          $inc: { profileCount: 1 },
          $push: {
            profile_ids: profileId,
            bankImages: {
              $each: detachedProfile.images,
            },
            displayedImages: {
              $each: detachedProfile.images,
              $slice: 6,
            },
          },
        };
      }

      // link to first party, add photos to photobank
      const updateUserObjectPromise = User
        .findByIdAndUpdate(user_id, userObjectUpdate, { new: true })
        .catch(err => err);

      // unlink detached profile from creator, link new endorsed profile
      const updateCreatorObjectPromise = User
        .findByIdAndUpdate(creator._id, {
          $pull: {
            detachedProfile_ids: detachedProfile_id,
          },
          $push: {
            endorsedProfile_ids: profileId,
          },
        }, { new: true })
        .catch(err => err);

      // delete detached profile
      const deleteDetachedProfilePromise = DetachedProfile.deleteOne({ _id: detachedProfile_id })
        .catch(err => err);

      return Promise.all([
        createUserProfileObjectePromise, updateUserObjectPromise,
        updateCreatorObjectPromise, deleteDetachedProfilePromise])
        .then(async ([
          createUserProfileObjectResult, updateUserObjectResult,
          updateCreatorObjectResult, deleteDetachedProfileResult]) => {
          // if at least one of the above four operations failed, roll back the others
          if (createUserProfileObjectResult instanceof Error
            || updateUserObjectResult instanceof Error
            || updateCreatorObjectResult instanceof Error
            || deleteDetachedProfileResult instanceof Error) {
            debug('error attaching profile, rolling back');
            let message = '';
            if (createUserProfileObjectResult instanceof Error) {
              message += createUserProfileObjectResult.toString();
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
              message += updateUserObjectResult.toString();
            } else {
              User.findByIdAndUpdate(user_id, {
                $inc: { profileCount: -1 },
                $pull: {
                  profile_ids: profileId,
                  bankImages: {
                    uploadedByUser_id: creator._id,
                  },
                },
              }, {}, (err) => {
                if (err) {
                  errorLog(`Failed to rollback user updates: ${err}`);
                  debug(`Failed to rollback user updates: ${err}`);
                } else {
                  debug('Rolled back user updates successfully');
                }
              });
            }
            if (updateCreatorObjectResult instanceof Error) {
              message += updateCreatorObjectResult.toString();
            } else {
              User.findByIdAndUpdate(user_id, {
                $push: {
                  detachedProfile_ids: detachedProfile_id,
                },
                $pull: {
                  endorsedProfile_ids: profileId,
                },
              }, {}, (err) => {
                if (err) {
                  errorLog(`Failed to roll back creator object: ${err}`);
                  debug(`Failed to roll back creator object: ${err}`);
                } else {
                  debug('Rolled back creator object successfully');
                }
              });
            }
            if (deleteDetachedProfileResult instanceof Error) {
              message += deleteDetachedProfileResult.toString();
            } else {
              const detachedProfileInput = pick(detachedProfile, [
                '_id',
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
              createDetachedProfileObject(detachedProfileInput)
                .then(() => {
                  debug('Recreated detached profile object successfully');
                })
                .catch((err) => {
                  errorLog(`Failed to recreate detached profile ${err}`);
                  debug(`Failed to recreate detached profile ${err}`);
                });
            }
            return {
              success: false,
              message,
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
          return {
            success: true,
            user: updateUserObjectResult,
          };
        });
    },

  },
};
