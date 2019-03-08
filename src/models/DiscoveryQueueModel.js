
const mongoose = require('mongoose');

const { Schema } = mongoose;
const debug = require('debug')('dev:DiscoveryQueue');

export const typeDef = `

type DiscoveryQueue{
  _id: ID!
  user_id: ID!
  user: User

  previousDiscoveryItems: [DiscoveryItem!]!
  currentDiscoveryItems: [DiscoveryItem!]!


}

type DiscoveryItem {
  _id: ID!
  userProfile_id: ID!
  userProfile: UserProfile!
  user_id: ID!
  user: User!
  timestamp: String
}

`;
const DiscoveryItemSchema = new Schema({
  userProfile_id: { type: Schema.Types.ObjectId, required: true },
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
