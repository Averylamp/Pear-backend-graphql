import express from 'express';
import { merge } from 'lodash';
import {
  typeDef as User,
} from './models/UserModel';
import {
  resolvers as UserResolvers,
} from './resolvers/UserResolver';
import {
  typeDef as UserProfile,
  resolvers as UserProfileResolvers,
} from './models/UserProfileModel';
import {
  typeDef as DetachedProfile,
  resolvers as DetachedProfileResolvers,
} from './models/DetachedProfile';
import {
  typeDef as Match,
  resolvers as MatchResolvers,
} from './models/MatchModel';
import {
  typeDef as UserMatches,
  resolvers as UserMatchesResolvers,
} from './models/UserMatchesModel';
import {
  typeDef as MatchRequest,
  resolvers as MatchRequestResolvers,
} from './models/MatchRequestModel';
import {
  typeDef as DiscoveryQueue,
} from './models/DiscoveryQueueModel';
import {
  resolvers as DiscoveryQueueResolvers,
} from './resolvers/DiscoveryQueueResolver';
import {
  typeDef as TestObject,
} from './models/TestModel';
import {
  resolvers as TestObjectResolvers,
} from './resolvers/TestObjectResolver';

const { ApolloServer } = require('apollo-server-express');

const URL = 'http://localhost';
const PORT = 1234;
const MONGO_URL = 'mongodb+srv://avery:0bz8M0eMEtyXlj2aZodIPpJpy@cluster0-w4ecv.mongodb.net/dev?retryWrites=true';
const debug = require('debug')('dev:Start');
const mongoose = require('mongoose');

const name = 'Pear';
debug('Booting %s', name);


export const start = async () => {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
    const db = mongoose.connection;
    db.on('error', debug.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
      debug('Mongo connected');

      const UsersDB = db.collection('users');
      const UserProfilesDB = db.collection('userprofiles');
      const DetachedProfilesDB = db.collection('detachedprofiles');
      const UserMatchesDB = db.collection('usermatches');
      const MatchRequestsDB = db.collection('matchrequests');
      const MatchesDB = db.collection('matches');
      const DiscoveriesDB = db.collection('discoveries');
      const DiscoveryQueuesDB = db.collection('discoveryqueues');
      const TestObjectsDB = db.collection('testobjects');

      const Query = `
    type Query {
      noOp: String
    }

    type Mutation {
      noOp: String
    }

    scalar Date


    `;
      const finalTypeDefs = [Query,
        User,
        UserProfile,
        DetachedProfile,
        Match, UserMatches,
        MatchRequest,
        DiscoveryQueue,
        TestObject];

      const resolvers = {
        Query: {
        },
      };

      const finalResolvers = merge(resolvers,
        UserResolvers,
        UserProfileResolvers,
        DetachedProfileResolvers,
        MatchResolvers,
        UserMatchesResolvers,
        MatchRequestResolvers,
        DiscoveryQueueResolvers,
        TestObjectResolvers);


      const server = new ApolloServer({
        typeDefs: finalTypeDefs,
        resolvers: finalResolvers,
        engine: {
          apiKey: 'service:pear-matchmaking-8936:V43kf4Urhi-63wQycK_yoA',
        },
        dataSources: () => ({
          usersDB: UsersDB,
          userProfilesDB: UserProfilesDB,
          detachedUserProfilesDB: DetachedProfilesDB,
          userMatchesDB: UserMatchesDB,
          matchRequestsDB: MatchRequestsDB,
          matchesDB: MatchesDB,
          discoveriesDB: DiscoveriesDB,
          discoveryQueuesDB: DiscoveryQueuesDB,
          testObjectsDB: TestObjectsDB,
        }),
      });
      const app = express();
      // app.use(cors())
      server.applyMiddleware({ app });


      app.listen({ port: PORT, ip: URL }, () => debug(`🚀 Server ready at ${URL}:${PORT}${server.graphqlPath}`));
    });
  } catch (e) {
    debug(e);
  }
};


export default start;
