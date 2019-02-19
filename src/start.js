import {MongoClient, ObjectId} from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import { GraphQLScalarType } from 'graphql';
import cors from 'cors'
import {prepare} from "../util/index"

import { typeDef as User } from "./models/usermodel.js"
import { typeDef as UserProfile } from "./models/userprofilemodel.js"
import { typeDef as Match } from "./models/matchmodel.js"
import { typeDef as UserMatches } from "./models/usermatchesmodel.js"
import { typeDef as MatchRequest } from "./models/matchrequestmodel.js"
import { typeDef as Discovery } from "./models/discoverymodel.js"
import { merge } from 'lodash';


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

    mongoose.connect(MONGO_URL, {useNewUrlParser: true })
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
    var db = mongoose.connection
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    console.log("Mongoose Connected")


    const UsersDB = db.collection('users')
    const UserProfilesDB = db.collection('userprofiles')
    const UserMatchesDB = db.collection('usermatches')
    const MatchRequestsDB = db.collection('matchrequests')
    const MatchesDB = db.collection('matches')

    const Query = `
    type Query {
      user(_id: ID): User
      users: [User]
      userProfile(_id: ID): UserProfile
    }

    scalar Date
    `


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
    const schema = makeExecutableSchema({
      typeDefs: [Query, User, UserProfile,  Match, UserMatches, MatchRequest, Discovery],
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
