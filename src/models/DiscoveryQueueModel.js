
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
}

`;

const discoveryQueueType = `
type DiscoveryQueue{
  _id: ID!
  user_id: ID!
  user: User

  previousDiscoveryItems: [DiscoveryItem!]!
  currentDiscoveryItems: [DiscoveryItem!]!
}

type DiscoveryItem {
  _id: ID!
  user_id: ID!
  user: User!
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
  user_id: { type: Schema.Types.ObjectId, required: false, index: true },
  previousDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
  currentDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
}, { timestamps: true });


export const DiscoveryQueue = mongoose.model('DiscoveryQueue', DiscoveryQueueSchema);
export const DiscoveryItem = mongoose.model('DiscoveryItem', DiscoveryItemSchema);

// discovery queue object is created when user is created
export const createDiscoveryQueueObject = function
createDiscoveryQueueObject(discoveryInput) {
  const discoveryQueueModel = new DiscoveryQueue(discoveryInput);


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
