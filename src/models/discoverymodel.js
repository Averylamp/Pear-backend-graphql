const mongoose = require('mongoose');

const { Schema } = mongoose;
const debug = require('debug')('dev:Discovery');

export const typeDef = `
type Discovery{
  _id: ID!
  profile_id: ID
  detachedProfile_id: ID
  user_id: ID
}
`;

export const resolvers = {
  Query: {

  },
  Discovery: {

  },
};

const DiscoverySchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  profile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  detachedProfile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  user_id: { type: Schema.Types.ObjectId, required: false, index: true },
});


export const Discovery = mongoose.model('Discovery', DiscoverySchema);


export const createDiscoveryObject = function
createDiscoveryObject(discoveryInput, _id = mongoose.Types.ObjectId) {
  const discoveryModel = new Discovery(discoveryInput);

  discoveryModel._id = _id;

  return new Promise((resolve, reject) => {
    discoveryModel.save((err) => {
      if (err) {
        debug(err);
        reject(err);
      }
      resolve(discoveryModel);
    });
  });
};
