
const mongoose = require('mongoose');

const { Schema } = mongoose;
const debug = require('debug')('dev:DiscoveryQueue');

export const typeDef = `
extend type Query {
  feed(user_id: ID!, last: Int): DiscoveryQueue
}

extend type Mutation {
  addToQueue(user_id: ID!, addedUser_id: ID!): DiscoveryMutationResponse! 
}

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
}

`;
const DiscoveryItemSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, required: true, default: Date },
});

const DiscoveryQueueSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  user_id: { type: Schema.Types.ObjectId, required: false, index: true },
  previousDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
  currentDiscoveryItems: { type: [DiscoveryItemSchema], required: true, default: [] },
});


export const DiscoveryQueue = mongoose.model('DiscoveryQueue', DiscoveryQueueSchema);
export const DiscoveryItem = mongoose.model('DiscoveryItem', DiscoveryItemSchema);

// discovery queue object is created when user is created
export const createDiscoveryQueueObject = function
createDiscoveryQueueObject(discoveryInput, _id = mongoose.Types.ObjectId) {
  const discoveryQueueModel = new DiscoveryQueue(discoveryInput);

  discoveryQueueModel._id = _id;

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
