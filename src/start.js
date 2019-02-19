import {MongoClient, ObjectId} from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import { GraphQLScalarType } from 'graphql';
import cors from 'cors'
import {prepare} from "../util/index"


const app = express()

app.use(cors())

const homePath = '/graphiql'
const URL = 'http://localhost'
const PORT = 3001
const MONGO_URL = "mongodb+srv://avery:0bz8M0eMEtyXlj2aZodIPpJpy@cluster0-w4ecv.mongodb.net/dev?retryWrites=true"


export const start = async () => {
  try {
    console.log("Starting Mongoose connect")


    const mongoose = require('mongoose');

    mongoose.connect(MONGO_URL, {useNewUrlParser: true });
    var db = mongoose.connection
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    console.log("Mongoose Connected")


    const UsersDB = db.collection('users')
    const UserProfilesDB = db.collection('userprofiles')
    const UserMatchesDB = db.collection('usermatches')
    const MatchRequestsDB = db.collection('matchrequests')
    const MatchesDB = db.collection('matches')

    const typeDefs = [`
      type Query {
        user(_id: ID): User
        users: [User]
        userProfile(_id: ID): UserProfile
      }

      scalar Date

      type User {
        _id: ID!
        firebaseToken: String!
        facebookId: String
        facebookAccessToken: String
        email: String!
        phoneNumber: String!
        fullName: String!
        firstName: String!
        lastName: String!
        userPreferences: UserPreferences!
        thumbnailURL: String
        gender: Gender
        locationName: String
        locationCoordinates: String
        school: String
        age: Int
        ethnicities: [String!]
        profile_ids: [ID!]!
        profile_objs: [UserProfile!]!
        endorsedProfile_ids: [ID!]!
        endorsedProfile_objs: [UserProfile!]!
        userStatData: UserStatData
        userMatches: UserMatches!
      }

      type UserMatches{
        _id: ID!
        user_id: ID!
        user_obj: User!
        matchRequest_ids: [ID!]!
        matchRequest_objs: [MatchRequest!]!
        matchRejected_ids: [ID!]!
        matchRejected_objs: [MatchRequest!]!
        matches_ids: [ID!]!
        matches_objs: [Match!]!
      }

      type UserStatData{
        toatlNumberOfMatchRequests: Int!
        totalNumberOfMatches: Int!
        totalNumberOfProfilesCreated: Int!
        totalNumberOfEndorsementsCreated: Int!
        conversationTotalNumber: Int!
        conversationTotalNumberFirstMessage: Int!
        conversationTotalNumberTenMessages: Int!
        conversationTotalNumberHundredMessages: Int!
      }

      type UserPreferences{
        ethnicities: [String!]!
        seekingGender: [Gender!]!
        seekingReason: [String!]!
        reasonDealbreaker: Int!
        seekingEthnicity: [String!]!
        ethnicityDealbreaker: Int!
        maxDistance: Int!
        distanceDealbreaker: Int!
        minAgeRange: Int!
        maxAgeRange: Int!
        ageDealbreaker: Int!
        minHeightRange: Int!
        maxHeightRange: Int!
        heightDealbreaker: Int!
      }

      type UserProfile{
        _id: ID!
        creator_id: ID!
        creator_obj: User!
        user_id: ID!
        user_obj: User!
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

        profileImageIDs: [String!]!
        profileImages: ImageSizes!
        discovery_id: ID!
        discovery_obj: Discovery!
        userProfileData: UserProfileData!
      }

      type UserProfileData{
        totalProfileViews: Int!
        totalProfileLikes: Int!
      }

      type ImageSizes{
        original: [ImageMetadata!]!
        large:    [ImageMetadata!]!
        medium:   [ImageMetadata!]!
        small:    [ImageMetadata!]!
        thumb:    [ImageMetadata!]!
      }

      type ImageMetadata{
        imageURL: String!
        imageID: String!
        imageSize: ImageSize!
      }

      type ImageSize{
        width: Int!
        height: Int!
      }

      type Discovery{
        _id: ID!
        profile_id: ID!
        profile_obj: UserProfile!


      }

      type MatchRequest{
        _id: ID!

        firstPersonMessageRequest: String!
        secondPersonMessageRequest: String!

        firstPersonEndorserUser_id: ID!
        firstPersonEndorserUser_obj: User!
        secondPersonEndorserUser_id: ID!
        secondPersonEndorserUser_obj: User!

        firstPersonUser_id: ID!
        firstPersonUser_obj: User!
        firstPersonProfile_id: ID!
        firstPersonProfile_obj: UserProfile!
        secondPersonUser_id: ID!
        secondPersonUser_obj: User!
        secondPersonProfile_id: ID!
        secondPersonProfile_obj: UserProfile!

        timestampCreated: Date!
        firstPersonResponse: MatchResponse
        firstPersonResponseTimestamp: Date
        secondPersonResponse: MatchResponse
        secondPersonResponseTimestamp: Date

        matchStatus: MatchStatus!
        matchStatusTimestamp: Date!
        matchCreated: Boolean!
        acceptedMatch_id: ID
        acceptedMatch_obj: Match
      }

      type Match{
        _id: ID!
        matchRequest_id: ID!
        matchRequest_obj: MatchRequest
        firstPersonUser_id: ID!
        firstPersonUser_obj: User!
        firstPersonProfile_id: ID!
        firstPersonProfile_obj: UserProfile!
        secondPersonUser_id: ID!
        secondPersonUser_obj: User!
        secondPersonProfile_id: ID!
        secondPersonProfile_obj: UserProfile!
        timestampCreated: Date
        conversationFirstMessageSent: Boolean!
        conversationTenMessagesSent: Boolean!
        conversationHundredMessagesSent: Boolean!
        firebaseConversationDocumentID: String!
      }

      enum MatchStatus{
        requests
        rejected
        accepted
      }

      enum MatchResponse{
        unseen
        seen
        rejected
        accepted
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
          return (await UsersDB.findOne({"_id":ObjectId(_id)}))
        },
        users: async () => {
          return (await UsersDB.find({}).toArray()).map(prepare)
        },
        userProfile: async (root, {_id}) => {
          console.log("Getting user profile by id: " + _id)
          return prepare(await UserProfilesDB.findOne({"_id":ObjectId(_id)}))
        },
        // endorsementProfile: async (root, {_id}) => {
        //   console.log("Getting endorsement profile by id: " + _id)
        //   return prepare(await EndorsedProfiles.findOne({"_id":ObjectId(_id)}))
        // }
      },
      User: {
        // personalProfile_id: async ({personalProfile_id}) => {
        //   return prepare(await UserProfiles.findOne({"_id":ObjectId(personalProfile_id)}))
        // }
      },
      UserProfile: {
        user_obj: async (root, {user_id}) => {
          console.log("Getting user by id: " + user_id)
          return prepare(await UsersDB.findOne({"_id":ObjectId(user_id)}))
        },
      },
      Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
          return new Date(value); // value from the client
        },
        serialize(value) {
          return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return new Date(ast.value) // ast value is always in string format
          }
          return null;
        },
      }),

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
