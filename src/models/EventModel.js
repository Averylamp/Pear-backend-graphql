import { ImageContainerSchema } from './ImageSchemas';
import { LocationSchema } from './LocationModels';
import { UserSchema } from './UserModel';

const mongoose = require('mongoose');
const debug = require('debug')('dev:UEventModel');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # Get a user by an ID
  event(id: ID!): Event

}

`;

const mutationRoutes = `
extend type Mutation{
  # Creates a new User Object
  createEvent(eventInput: CreationEventInput!): EventMutationResponse!

  # Updates an existing User
  updateEvent(updateEventInput: UpdateEventInput!): EventMutationResponse!

}
`;

const createEventInputs = `
input CreationEventInput{
  eventName: String!
  eventLocationName: String!
  eventLocation: [Float!]

  eventHostIDs:[ID!]!

  isOnline: Boolean!
  groupChat: Boolean!

  eventDescription: String!

  forYouVisibility:Boolean!
  forYouVisibilityAgeMinimum: Int!
  forYouVisibilityAgeMaximum: Int!
  forYouVisibilityGender: [Gender]!

  displayedImages: [CreateImageContainer!]!
  displayedImagesCount: Int!

}
`;

const updateEventInputs = `
input UpdateEventInput {
  eventName: String
  eventLocationName: String
  eventLocation: [Float]

  eventHostIDs:[ID!]!

  isOnline: Boolean
  groupChat: Boolean

  eventDescription: String

  forYouVisibility:Boolean
  forYouVisibilityAgeMinimum: Int
  forYouVisibilityAgeMaximum: Int
  forYouVisibilityGender: [Gender]

  displayedImages: [CreateImageContainer!]
}
`;

const updateEventPhotosInput = `
input UpdateEventPhotosInput {
  event_id: ID!
  displayedImages: [CreateImageContainer!]!
}

`;

const eventType = `
type Event {
  _id: ID!
  eventName: String!
  eventLocationName: String!
  eventLocation: Location

  eventHostIDs:[ID!]!
  eventHosts:[User!]!

  isOnline: Boolean!
  groupChat: Boolean!

  eventDescription: String!

  forYouVisibility:Boolean!
  forYouVisibilityAgeMinimum: Int!
  forYouVisibilityAgeMaximum: Int!
  forYouVisibilityGender: [Gender]!

  thumbnailURL: String
  displayedImages: [ImageContainer!]!
}

`;

const mutationResponse = `
type EventMutationResponse{
  success: Boolean!
  message: String
  event: Event
}

type EventDeletionResponse {
  success: Boolean!
  message: String
}
`;

export const typeDef = queryRoutes
  + mutationRoutes
  + createEventInputs
  + updateEventInputs
  + updateEventPhotosInput
  + eventType
  + mutationResponse;

const EventSchema = new Schema({
  eventName: { type: String, required: true },
  eventLocationName: { type: String, required: true },
  eventLocation: {
    type: LocationSchema,
    required: false,
  },
  eventHosts: { type: [UserSchema], required: true },
  isOnline: { type: Boolean, required: true },
  groupChat: { type: Boolean, required: true },

  eventDescription: { type: String, required: true },

  forYouVisibility: { type: Boolean, required: true, default: true },
  forYouVisibilityGender: {
    type: [String],
    required: true,
    enum: ['male', 'female', 'nonbinary'],
    default: ['male', 'female', 'nonbinary'],
  },
  forYouVisibilityDistance: {
    // in miles
    type: Number,
    required: true,
    min: 5,
    max: 200,
    default: 25,
  },
  forYouVisibilityAgeMinimum: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
    default: 18,
  },
  forYouVisibilityAgeMaximum: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
    default: 27,
  },
  location: {
    type: LocationSchema,
    required: false,
  },

  thumbnailURL: { type: String, required: false },
  displayedImages: { type: [ImageContainerSchema], required: true, default: [] },
  displayedImagesCount: {
    type: Number,
    required: true,
    index: true,
    default: 0,
  },

}, { timestamps: true });

export const Event = mongoose.model('Event', EventSchema);

export const createEventObject = (eventInput, skipTimestamps) => {
  const eventModel = new Event(eventInput);
  return eventModel.save({ timestamps: !skipTimestamps })
    .catch((err) => {
      debug(`error occurred: ${err}`);
      return null;
    });
};
