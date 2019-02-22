var mongoose = require('mongoose');
var Schema = mongoose.Schema;

export const typeDef = `
type Discovery{
  _id: ID!
  profile_id: ID
  user_id: ID
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
  profile_id: { type: Schema.Types.ObjectId, required: false, index: true },
  user_id: { type: Schema.Types.ObjectId, required: false, index: true },
})


export const Discovery = mongoose.model("Discovery", DiscoverySchema)


export const createDiscoveryObject = function createDiscoveryObject(discoveryInput, _id = mongoose.Types.ObjectId) {
  var discoveryModel = new Discovery(discoveryInput)

  discoveryModel._id = _id

  return new Promise((resolve, reject) => {
    discoveryModel.save(function (err) {
      if (err){
        console.log(err)
        reject(err)
      }
      resolve( discoveryModel )
    })
  })

}
