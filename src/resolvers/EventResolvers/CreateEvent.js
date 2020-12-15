import { createEventObject } from '../../models/EventModel';
import { User } from '../../models/UserModel';
import { GET_USER_ERROR, CREATE_EVENT_ERROR } from '../ResolverErrorStrings';
import { rollbackObject } from '../../../util/util';

const mongoose = require('mongoose');
const errorLog = require('debug')('error:CreateEventResolver');
const debug = require('debug')('dev:CreateEventResolver');

export const createEventResolver = async ({ eventInput }) => {
  const eventID = mongoose.Types.ObjectId();
  eventInput._id = eventID;
  const createEventObj = createEventObject(eventInput)
    .catch((err) => err);

  const hostIDs = eventInput.eventHostIDs;
  const initialHosts = [];
  for (const hostID of hostIDs) {
    const creator = await User.findById(hostID)
      .exec()
      .catch((err) => err);
    if (!creator) {
      return {
        success: false,
        message: GET_USER_ERROR,
      };
    }
    initialHosts.push(creator.toObject());
  }

  const updateHostObject = async ({ updateHostID }) => User.findByIdAndUpdate(updateHostID, {
    $addToSet: {
      hostingEventIDs: eventID,
    },
  }, { new: true })
    .exec()
    .catch((err) => err);

  return Promise.all([createEventObj])
    .then(async ([eventObject]) => {
      if (eventObject instanceof Error) {
        debug('error occurred while creating event');
        let errorMessage = '';
        if (eventObject instanceof Error) {
          errorMessage += eventObject.toString();
        }
        errorLog(errorMessage);
        return {
          success: false,
          message: CREATE_EVENT_ERROR,
        };
      }
      for (const rollbackUser of initialHosts) {

      }
      return {
        success: true,
        event: eventObject,
      };
    });
};
