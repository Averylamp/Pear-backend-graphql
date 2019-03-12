import { pick } from 'lodash';
import { createUserMatchesObject, UserMatches } from '../models/UserMatchesModel';
import { createDiscoveryQueueObject, DiscoveryQueue } from '../models/DiscoveryQueueModel';
import { createUserObject, User } from '../models/UserModel';
import { createUserProfileObject, UserProfile } from '../models/UserProfileModel';
import { createDetachedProfileObject, DetachedProfile } from '../models/DetachedProfile';

const mongoose = require('mongoose');
const $ = require('mongo-dot-notation');
const debug = require('debug')('dev:UserResolvers');
const functionCallConsole = require('debug')('dev:FunctionCalls');

const firebaseAdmin = require('firebase-admin');

const serviceAccount = require('../../pear-firebase-adminsdk.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://pear-59123.firebaseio.com',
});


export const resolvers = {
  Query: {
    user: async (_source, { id }) => {
      debug(`Getting user by id: ${id}`);
      return User.findById(id);
    },
    getUser: async (_source, { userInput }) => {
      functionCallConsole('Get User Called');
      const idToken = userInput.firebaseToken;
      const uid = userInput.firebaseAuthID;
      return new Promise(resolve => firebaseAdmin.auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const firebaseUID = decodedToken.uid;
          if (uid === firebaseUID) {
            debug('token matches provided UID');
            const user = User.findOne({ firebaseAuthID: uid });
            if (user) {
              functionCallConsole('Validated');
              resolve({
                success: true,
                message: 'Successfully fetched',
                user,
              });
            } else {
              resolve({
                success: false,
                message: 'Failed to fetch user',
              });
            }
          } else {
            debug('token does not match');
            resolve({
              success: false,
              message: 'Failed to fetch user',
            });
          }
        })
        .catch((error) => {
          debug('Failed to Decoded token');
          // Handle error
          debug(error);
          resolve({
            success: false,
            message: 'Failed to verify token',
          });
        }));
    },
  },
  User: {
    profileObjs: async ({ profile_ids }) => UserProfile.find({ _id: { $in: profile_ids } }),
    endorsedProfileObjs: async ({ endorsedProfile_ids }) => UserProfile
      .find({ _id: { $in: endorsedProfile_ids } }),
    detachedProfileObjs: async ({ detachedProfile_ids }) => DetachedProfile
      .find({ _id: { $in: detachedProfile_ids } }),
    userMatchesObj: async ({ userMatches_id }) => UserMatches.findById(userMatches_id),
    discoveryQueueObj: async ({ discoveryQueue_id }) => DiscoveryQueue.findById(discoveryQueue_id),
  },
  Mutation: {
    createUser: async (_source, { userInput }) => {
      functionCallConsole('Create User');
      const userObjectID = '_id' in userInput ? userInput._id : mongoose.Types.ObjectId();
      const userMatchesObjectID = mongoose.Types.ObjectId();
      const disoveryQueueObjectID = mongoose.Types.ObjectId();
      debug(`IDs:${userObjectID}, ${userMatchesObjectID}, ${disoveryQueueObjectID}`);

      const finalUserInput = userInput;
      finalUserInput._id = userObjectID;
      finalUserInput.userMatches_id = userMatchesObjectID;
      finalUserInput.discoveryQueue_id = disoveryQueueObjectID;
      const createUserObj = createUserObject(finalUserInput)
        .catch(err => err);

      const createUserMatchesObj = createUserMatchesObject(
        {
          user_id: userObjectID,
          _id: userMatchesObjectID,
        },
      )
        .catch(err => err);

      const createDiscoveryQueueObj = createDiscoveryQueueObject(
        {
          user_id: userObjectID,
          _id: disoveryQueueObjectID,
        },
      )
        .catch(err => err);

      return Promise.all([createUserObj, createUserMatchesObj, createDiscoveryQueueObj])
        .then(([userObject, userMatchesObject, discoveryQueueObject]) => {
          if (userObject instanceof Error
            || userMatchesObject instanceof Error
            || discoveryQueueObject instanceof Error) {
            let message = '';
            if (userObject instanceof Error) {
              message += userObject.toString();
            } else {
              userObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove user object${err}`);
                } else {
                  debug('Removed created user object successfully');
                }
              });
            }
            if (userMatchesObject instanceof Error) {
              message += userMatchesObject.toString();
            } else {
              userMatchesObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove user matches object${err}`);
                } else {
                  debug('Removed created user matches object successfully');
                }
              });
            }
            if (discoveryQueueObject instanceof Error) {
              message += discoveryQueueObject.toString();
            } else {
              discoveryQueueObject.remove((err) => {
                if (err) {
                  debug(`Failed to remove discovery object${err}`);
                } else {
                  debug('Removed created discovery object successfully');
                }
              });
            }
            return {
              success: false,
              message,
            };
          }
          return {
            success: true,
            user: userObject,
          };
        });
    },
    updateUser: async (_source, { id, updateUserInput }) => {
      functionCallConsole('Update User Called');
      const finalUpdateUserInput = $.flatten(updateUserInput);
      return new Promise(resolve => User.findByIdAndUpdate(
        id, finalUpdateUserInput, {
          new: true,
          runValidators: true,
        },
        (err, user) => {
          if (err) {
            resolve({
              success: false,
              message: err.toString(),
            });
          } else {
            resolve({
              success: true,
              user,
              message: 'Successfully updated',
            });
          }
        },
      ));
    },
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
      debug(detachedProfile);
      debug(detachedProfile.creatorUser_id);
      debug(creatorUser_id);
      // check that creator made detached profile

      if (creatorUser_id !== detachedProfile.creatorUser_id.toString()) {
        return {
          success: false,
          message: `${creatorUser_id} is not creator of detached profile ${detachedProfile_id}`,
        };
      }
      // check creator != user
      // if (creatorUser_id === user_id) {
      //   return {
      //     success: false,
      //     message: 'Can\'t create profile for yourself',
      //   };
      // }
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

      // link to first party, add photos to photobank
      const updateUserObjectPromise = User
        .findByIdAndUpdate(user_id, {
          $push: {
            profile_ids: profileId,
            bankImages: {
              $each: detachedProfile.images,
            },
          },
        }, { new: true })
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
        .then(([
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
                $pull: {
                  profile_ids: profileId,
                  bankImages: {
                    uploadedBy_id: creator._id,
                  },
                },
              }, {}, (err) => {
                if (err) {
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
                  debug(`Failed to recreate detached profile ${err}`);
                });
            }
            return {
              success: false,
              message,
            };
          }
          return {
            success: true,
            user: updateUserObjectResult,
          };
        });
    },
    updatePhotos: async (_source, { updateUserPhotosInput }) => {
      functionCallConsole('Update Photos Called');
      debug(`input object is ${updateUserPhotosInput}`);
      const { user_id, displayedImages, additionalImages } = updateUserPhotosInput;
      const user = await User.findById(user_id);
      if (!user) {
        return {
          success: false,
          message: `User with id ${user_id} does not exist`,
        };
      }
      const toAddToImageBank = [];
      displayedImages.forEach((createImageContainer) => {
        let imageAlreadyInBank = false;
        for (const userImageContainer of user.bankImages) {
          if (userImageContainer.imageID === createImageContainer.imageID) {
            imageAlreadyInBank = true;
            break;
          }
        }
        if (!imageAlreadyInBank) {
          toAddToImageBank.push(createImageContainer);
        }
      });

      additionalImages.forEach((createImageContainer) => {
        let imageAlreadyInBank = false;
        for (const userImageContainer of user.bankImages) {
          if (userImageContainer.imageID === createImageContainer.imageID) {
            imageAlreadyInBank = true;
            break;
          }
        }
        if (!imageAlreadyInBank) {
          toAddToImageBank.push(createImageContainer);
        }
      });

      return User.findByIdAndUpdate(user_id, {
        displayedImages,
        $push: {
          bankImages: {
            $each: toAddToImageBank,
          },
        },
      }, { new: true })
        .then(res => ({
          success: true,
          user: res,
        }))
        .catch(err => ({
          success: false,
          message: `Failed to update user with new photos: ${err}`,
        }));
    },
  }
  ,
};
