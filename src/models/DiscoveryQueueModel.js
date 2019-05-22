import { MatchingPreferencesSchema } from './MatchingSchemas';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # retrieves the discovery feed for the provided user
  getDiscoveryFeed(user_id: ID!, last: Int): DiscoveryQueue
  
  # retrieves cards for a given set of preferences: [DiscoveryItemSchema]
  getDiscoveryCards(user_id: ID!, filters: FiltersInput, max: Int): DiscoveryItemsResponse
}
`;

const mutationRoutes = `
extend type Mutation {
  # OLD: User pressed "skip" on the discovery feed
  skipDiscoveryItem(user_id: ID!, discoveryItem_id: ID!): DiscoveryMutationResponse!
  
  # optionally specify the id of the discovery item to add
  addToQueue(user_id: ID!, addedUser_id: ID!, item_id: ID): DiscoveryMutationResponse!
  
  # numberOfItems defaults to 1
  forceUpdateFeed(user_id: ID!, numberOfItems: Int): DiscoveryMutationResponse!
  
  # devmode only
  clearFeed(user_id: ID!): DiscoveryMutationResponse!
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
  timestamp: String!
}

type DiscoveryMutationResponse {
  success: Boolean!
  message: String
}

type DiscoveryItemsResponse {
  success: Boolean!
  message: String
  items: [DiscoveryItem!]
}

`;

export const typeDef = queryRoutes
+ mutationRoutes
+ discoveryQueueType;

const DiscoveryItemSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, required: true, default: Date },
}, { timestamps: true });

const DecidedDiscoveryItemSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, required: true, default: Date },
  action: { type: String, required: true, enum: ['skip', 'match', 'pear'] },
});

const DiscoveryQueueSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true, index: true },
  historyDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
  currentDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
  skippedUser_ids: {
    type: [Schema.Types.ObjectId], required: false, default: [], index: true,
  },
  decidedDiscoveryItems: { type: [DecidedDiscoveryItemSchema], required: true, default: [] },
  currentFilters: { type: MatchingPreferencesSchema, required: false },
}, { timestamps: true });


export const DiscoveryQueue = mongoose.model('DiscoveryQueue', DiscoveryQueueSchema);
export const DiscoveryItem = mongoose.model('DiscoveryItem', DiscoveryItemSchema);

// discovery queue object is created when user is created
export const createDiscoveryQueueObject = function
createDiscoveryQueueObject(discoveryInput, skipTimestamps) {
  const discoveryQueueModel = new DiscoveryQueue(discoveryInput);
  return discoveryQueueModel.save({ timestamps: !skipTimestamps });
};
