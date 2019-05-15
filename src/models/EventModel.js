import { IconAssetRefSchema } from './ContentModels';

const mongoose = require('mongoose');
const debug = require('debug')('dev:EventModel');

const { Schema } = mongoose;

const eventType = `
type Event {
  _id: ID!
  code: String!
  name: String!
  icon: IconAssetRef
  startTime: String!
  endTime: String!
}

input EventInput {
  _id: ID
  code: String!
  name: String!
  icon: IconAssetRefInput
  startTime: String!
  endTime: String!
}

type EventMutationResponse {
  success: Boolean!
  message: String
  event: Event
}
`;

const queryRoutes = `
extend type Query {
  getEventByCode(code: String!): Event 
}
`;

const mutationRoutes = `
extend type Mutation {
  createEvent(eventInput: EventInput!): EventMutationResponse!
}
`;

export const typeDef = eventType
  + queryRoutes
  + mutationRoutes;

const EventSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  icon: { type: IconAssetRefSchema, required: false },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
});

export const EventModel = mongoose.model('Event', EventSchema);

export const createEvent = (eventInput) => {
  const eventModel = new EventModel(eventInput);
  return eventModel.save()
    .catch((err) => {
      debug(`error occurred: ${err}`);
      return null;
    });
};
