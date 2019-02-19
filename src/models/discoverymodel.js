var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `
type Discovery{
  _id: ID!
  profile_id: ID!
}
`

export const resolvers = {
  Query: {

  },
  Discovery: {

  }
}

var DiscoverySchema = new Schema ({
  _id: { type: Schema.Types.ObjectId, required: true },
  profile_id: { type: Schema.Types.ObjectId, required: true, index: true },
})


export const Discovery = mongoose.model("Discovery", DiscoverySchema)
