import {
  CREATE_EVENT_ERROR,
} from '../ResolverErrorStrings';
import { createEventResolver } from './CreateEvent';

const debug = require('debug')('dev:EventResolvers');
const errorLog = require('debug')('error:EventResolver');
const functionCallConsole = require('debug')('dev:FunctionCalls');

export const resolvers = {
  User: {
  },
  Query: {
  },
  Mutation: {
    createEvent: async (_source, { eventInput }) => {
      functionCallConsole('Create Event');
      try {
        return createEventResolver({ eventInput });
      } catch (e) {
        errorLog(`error occurred while creating user: ${e}`);
        return {
          success: false,
          message: CREATE_EVENT_ERROR,
        };
      }
    },
  },
};
