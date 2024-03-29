import { dbOld } from '../migration1/Migration1Setup';

const mongoose = require('mongoose');

const { Schema } = mongoose;
const debug = require('debug')('dev:DiscoveryQueue');

const queryRoutes = `
extend type Query {
  # Retreives the discovery feed for the provided user
  getDiscoveryFeed(user_id: ID!, last: Int): DiscoveryQueue
}
`;

const mutationRoutes = `
extend type Mutation {
  addToQueue(user_id: ID!, addedUser_id: ID!): DiscoveryMutationResponse!
  # numberOfItems defaults to 1
  forceUpdateFeed(user_id: ID!, numberOfItems: Int): DiscoveryMutationResponse!
}
`;

const discoveryQueueType = `
type DiscoveryQueue{
  _id: ID!
  user_id: ID!
  user: User
  historyDiscoveryItems: [DiscoveryItem!]!
  currentDiscoveryItems: [DiscoveryItem!]!
}
type DiscoveryItem {
  _id: ID!
  user_id: ID!
  user: User
  timestamp: String
}
type DiscoveryMutationResponse {
  success: Boolean!
  message: String
}
`;

export const typeDef = queryRoutes
  + mutationRoutes
  + discoveryQueueType;

const DiscoveryItemSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, required: true, default: Date },
}, { timestamps: true });

const DiscoveryQueueSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  historyDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
  currentDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
}, { timestamps: true });


export const DiscoveryQueueOld = dbOld ? dbOld.model('DiscoveryQueue', DiscoveryQueueSchema) : null;

// discovery queue object is created when user is created
export const createDiscoveryQueueObject = function
createDiscoveryQueueObject(discoveryInput) {
  const discoveryQueueModel = new DiscoveryQueueOld(discoveryInput);


  return new Promise((resolve, reject) => {
    discoveryQueueModel.save((err) => {
      if (err) {
        debug(err);
        reject(err);
      }
      resolve(discoveryQueueModel);
    });
  });
};
