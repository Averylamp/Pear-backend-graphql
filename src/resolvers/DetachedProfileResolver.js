import { DetachedProfile, createDetachedProfileObject } from '../models/DetachedProfile';
import { User } from '../models/UserModel';


const mongoose = require('mongoose');
const debug = require('debug')('dev:DetachedProfileResolvers');
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

  },
  Mutation: {
    createDetachedProfile: async (_, { detachedProfileInput }) => {
      functionCallConsole('Create Detached Profile Called');

      const detachedProfileID = mongoose.Types.ObjectId();
      const finalDetachedProfileInput = detachedProfileInput;
      finalDetachedProfileInput._id = detachedProfileID;

      const { creatorUser_id } = detachedProfileInput;

      const updateCreatorUserObject = User.findByIdAndUpdate(creatorUser_id, {
        $push: {
          detachedProfile_ids: detachedProfileID,
        },
      }, { new: true }).exec().catch(err => err);

      const createDetachedProfileObj = createDetachedProfileObject(finalDetachedProfileInput)
        .catch(err => err);

      return Promise.all([updateCreatorUserObject, createDetachedProfileObj])
        .then(([newUser, detachedProfileObject]) => {
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
          return {
            success: true,
            detachedProfile: detachedProfileObject,
          };
        });
    },

  },
};
