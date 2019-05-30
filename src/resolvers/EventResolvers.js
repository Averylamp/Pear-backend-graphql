import { pick } from 'lodash';
import { createEvent, EventModel } from '../models/EventModel';
import { CREATE_EVENT_ERROR } from './ResolverErrorStrings';
import { devMode } from '../constants';

const mongoose = require('mongoose');
const errorLog = require('debug')('error:EventResolvers');

export const resolvers = {
  Query: {
    getEventByCode: async (_source, { code }) => EventModel.findOne({ code }).exec(),
    getEventById: async (_source, { event_id }) => EventModel.findById(event_id).exec(),
  },
  Mutation: {
    createEvent: async (_source, { eventInput }) => {
      if (!devMode) {
        return {
          success: false,
          message: 'need to be in dev mode to add events',
        };
      }
      try {
        const eventObjectId = '_id' in eventInput ? eventInput._id : mongoose.Types.ObjectId();
        const finalEventInput = pick(eventInput, [
          'code',
          'name',
          'icon',
          'startTime',
          'endTime',
        ]);
        finalEventInput._id = eventObjectId;
        const event = await createEvent(finalEventInput);
        return {
          success: true,
          event,
        };
      } catch (e) {
        errorLog(`error occurred: ${e}`);
        return {
          success: false,
          message: CREATE_EVENT_ERROR,
        };
      }
    },
  },
};
