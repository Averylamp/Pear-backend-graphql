import {MongoClient, ObjectId} from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import cors from 'cors'
import {prepare} from "../util/index"


const app = express()

app.use(cors())

const homePath = '/graphiql'
const URL = 'http://localhost'
const PORT = 3001
const MONGO_URL = "mongodb://avery:E5YXUKiv2Uyt_pM@cluster0-shard-00-00-moobp.mongodb.net:27017,cluster0-shard-00-01-moobp.mongodb.net:27017,cluster0-shard-00-02-moobp.mongodb.net:27017/dev?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
// 'mongodb://avery:E5YXUKiv2Uyt_pM@cluster0-moobp.mongodb.net/dev'

export const start = async () => {
  try {
    console.log("Starting mongo connect")
    const db = await MongoClient.connect(MONGO_URL)
    console.log("Mongo Connected")

    const Users = db.collection('users')
    const UserProfiles = db.collection('userprofiles')
    const EndorsedProfiles = db.collection('endorsedprofiles')

    const typeDefs = [`
      type Query {
        user(_id: ID): User
        users: [User]
        userProfile(_id: ID): UserProfile
        endorsementProfile(_id: ID): EndorsementProfile
      }

      type User {
        _id: ID!
        facebookId: String!
        email: String!
        fullName: String!
        firstName: String!
        lastName: String!
        gender: Gender!
        locationName: String
        locationCoordinates: String
        school: String
        age: Int!
        ethnicities: [String!]!
        facebookAccessToken: String
        photoURL: String
        facebookProfileLink: String
        firebaseId: String
        personalProfile_id: UserProfile
        endorsedProfiles_ids: [ID!]!
        friendEndorsedProfile_ids: [ID!]!
      }

      type UserProfile{
        profileType: ProfileType!
        user_id: User!
        activeProfile: Boolean!
        activeDiscovery: Boolean!
        fullName: String!
        firstName: String!
        lastName: String!
        gender: Gender!
        age: Int!
        height: Int
        locationName: String
        locationCoordinates: String
        school: String
        ethnicities: [String!]!
        seekingGender: [Gender!]!
        seekingReason: [String!]!
        seekingEthnicity: [String!]!
        maxDistance: Int!
        minAgeRange: Int!
        maxAgeRange: Int!
        minHeightRange: Int!
        maxHeightRange: Int!
        profileEmail: String
        facebookProfileLink: String
        profileImageIDs: [String!]!
        profileImageURLs: [String!]
        discovery_id: ID!
        matches_id: ID!
        traitScores: [Int]
        questions: [String]
      }

      type EndorsementProfile{
        approvedEndorsement: Boolean!
        endorsedUser_id: ID
        creatorEmail: String
        creatorProfileLink: String
        profileType: ProfileType!
        user_id: String!
        activeProfile: Boolean!
        activeDiscovery: Boolean!
        fullName: String!
        firstName: String!
        lastName: String!
        gender: Gender!
        age: Int!
        height: Int
        locationName: String
        locationCoordinates: String
        school: String
        ethnicities: [String!]!
        seekingGender: [Gender!]!
        seekingReason: String
        seekingEthnicity: String
        maxDistance: Int!
        minAgeRange: Int!
        maxAgeRange: Int!
        minHeightRange: Int!
        maxHeightRange: Int!
        profileEmail: String
        facebookProfileLink: String
        profileImageIDs: [String!]!
        profileImageURLs: [String!]!
        discovery_id: ID!
        matches_id: ID!
        traitScores: [Int]
        questions: [String]
      }

      enum ProfileType{
        personalProfile
        endorsedProfile
      }

      enum Gender{
        male
        female
        nonbinary
      }

      schema {
        query: Query
      }
    `];

    const resolvers = {
      Query: {
        user: async (root, {_id}) => {
          console.log("Getting user by id: " + _id)
          return (await Users.findOne({"_id":ObjectId(_id)}))
        },
        users: async () => {
          return (await Users.find({}).toArray()).map(prepare)
        },
        userProfile: async (root, {_id}) => {
          console.log("Getting user profile by id: " + _id)
          return prepare(await UserProfiles.findOne({"_id":ObjectId(_id)}))
        },
        endorsementProfile: async (root, {_id}) => {
          console.log("Getting endorsement profile by id: " + _id)
          return prepare(await EndorsedProfiles.findOne({"_id":ObjectId(_id)}))
        }
      },
      User: {
        personalProfile_id: async ({personalProfile_id}) => {
          return prepare(await UserProfiles.findOne({"_id":ObjectId(personalProfile_id)}))
        }
      },
      UserProfile: {
        user_id: async (root, {user_id}) => {
          console.log("Getting user by id: " + user_id)
          return prepare(await Users.findOne({"_id":ObjectId(user_id)}))
        },
      },
    }
    // const typeDefs = [`
    //   type Query {
    //     post(_id: String): Post
    //     posts: [Post]
    //     comment(_id: String): Comment
    //   }
    //
    //   type Post {
    //     _id: String
    //     title: String
    //     content: String
    //     comments: [Comment]
    //   }
    //
    //   type Comment {
    //     _id: String
    //     postId: String
    //     content: String
    //     post: Post
    //   }
    //
    //   type Mutation {
    //     createPost(title: String, content: String): Post
    //     createComment(postId: String, content: String): Comment
    //   }
    //
    //   schema {
    //     query: Query
    //     mutation: Mutation
    //   }
    // `];

    // const resolvers = {
    //   Query: {
    //     post: async (root, {_id}) => {
    //       return prepare(await Posts.findOne(ObjectId(_id)))
    //     },
    //     posts: async () => {
    //       return (await Posts.find({}).toArray()).map(prepare)
    //     },
    //     comment: async (root, {_id}) => {
    //       return prepare(await Comments.findOne(ObjectId(_id)))
    //     },
    //   },
    //   Post: {
    //     comments: async ({_id}) => {
    //       return (await Comments.find({postId: _id}).toArray()).map(prepare)
    //     }
    //   },
    //   Comment: {
    //     post: async ({postId}) => {
    //       return prepare(await Posts.findOne(ObjectId(postId)))
    //     }
    //   },
    //   Mutation: {
    //     createPost: async (root, args, context, info) => {
    //       const res = await Posts.insertOne(args)
    //       return prepare(res.ops[0])  // https://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#~insertOneWriteOpResult
    //     },
    //     createComment: async (root, args) => {
    //       const res = await Comments.insert(args)
    //       return prepare(await Comments.findOne({_id: res.insertedIds[1]}))
    //     },
    //   },
    // }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    })


    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))


    app.use(homePath, graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`)
    })

  } catch (e) {
    console.log(e)
  }

}
