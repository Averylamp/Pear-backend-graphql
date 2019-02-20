const { gql } = require('apollo-server');
const { ApolloServer } = require('apollo-server-express');
import express from 'express';
import cors from 'cors'
import { GraphQLScalarType } from 'graphql';
import {makeExecutableSchema} from 'graphql-tools'

import { typeDef as User,
         resolvers as UserResolvers } from "./models/usermodel.js"
import { typeDef as UserProfile,
         resolvers as UserProfileResolvers } from "./models/userprofilemodel.js"
import { typeDef as Match,
         resolvers as MatchResolvers } from "./models/matchmodel.js"
import { typeDef as UserMatches,
         resolvers as UserMatchesResolvers } from "./models/usermatchesmodel.js"
import { typeDef as MatchRequest,
         resolvers as MatchRequestResolvers } from "./models/matchrequestmodel.js"
import { typeDef as Discovery,
         resolvers as DiscoveryResolvers } from "./models/discoverymodel.js"
import { merge } from 'lodash';



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
    const DiscoveriesDB = db.collection('discoveries')

    const Query = `
    type Query {
      user(_id: ID): User
      users: [User]
    }

    scalar Date

    `
    // const combinedTypeDefs = Query + User + UserProfile +  Match + UserMatches + MatchRequest + Discovery
    // console.log(combinedTypeDefs)
    const finalTypeDefs = [Query, User, UserProfile, Match, UserMatches, MatchRequest, Discovery]
    const resolvers = {
      Query: {
      }
    };

    const finalResolvers = merge(resolvers, UserResolvers, UserProfileResolvers, MatchResolvers, UserMatchesResolvers, MatchRequestResolvers, DiscoveryResolvers,);


    const server = new ApolloServer({
      typeDefs: finalTypeDefs,
      resolvers: finalResolvers,
      engine: {
        apiKey: "service:pear-matchmaking-8936:V43kf4Urhi-63wQycK_yoA"
      },
      dataSources: () => {
        return {
          usersDB: UsersDB,
          userProfilesDB: UserProfilesDB,
          userMatchesDB: UserMatchesDB,
          matchRequestsDB: MatchRequestsDB,
          matchesDB: MatchesDB,
          discoveriesDB: DiscoveriesDB,
        }
      }
    });
    console.log("Created server")
    const app = express();
    // app.use(cors())
    console.log("Applying middlewear")
    server.applyMiddleware({ app });


    app.listen({ port: PORT, ip: URL }, () =>
      console.log(`🚀 Server ready at ${URL}:${PORT}${server.graphqlPath}`),
    );


  } catch (e) {
    console.log(e)
  }

}
