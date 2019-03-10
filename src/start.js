import express from 'express';
import bodyParser from 'body-parser';
import { merge } from 'lodash';
import sendMessage from './SMSHelper';
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
  typeDef as ImageSizes,
} from './models/ImageSchemas';
import {
  typeDef as DetachedProfile,
} from './models/DetachedProfile';
import {
  resolvers as DetachedProfileResolvers,
} from './resolvers/DetachedProfileResolver';
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
import {
  typeDef as MatchingSchemas,
} from './models/MatchingSchemas'
import createTestDB from './tests/CreateTestDB';

const { ApolloServer } = require('apollo-server-express');

let devMode = false;
let regenTestDBMode = false;
if (process.env.DEBUG) {
  devMode = true;
  if (process.env.REGENDB) {
    regenTestDBMode = true;
  }
}

const debug = require('debug')('dev:Start');

const URL = 'http://localhost';
const PORT = 1234;
let dbName = 'prod';
if (devMode) {
  debug('Debug Mode Detected');
  dbName = 'd';
  if (regenTestDBMode) {
    debug('Regen Test DB Mode Detected');
    dbName = 'dev-test';
  }
  debug(`Database: ${dbName}`);
}
const MONGO_URL = `mongodb+srv://avery:0bz8M0eMEtyXlj2aZodIPpJpy@cluster0-w4ecv.mongodb.net/${dbName}?retryWrites=true`;
const mongoose = require('mongoose');

debug(MONGO_URL);

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

      const dataSourcesObject = {
        usersDB: UsersDB,
        userProfilesDB: UserProfilesDB,
        detachedUserProfilesDB: DetachedProfilesDB,
        userMatchesDB: UserMatchesDB,
        matchRequestsDB: MatchRequestsDB,
        matchesDB: MatchesDB,
        discoveriesDB: DiscoveriesDB,
        discoveryQueuesDB: DiscoveryQueuesDB,
        testObjectsDB: TestObjectsDB,
      };

      const Query = `
      type Query {
        noOp: String
      }
  
      type Mutation {
        noOp: String
      }
  
      scalar Date
  
  
      `;
      const finalTypeDefs = [
        Query,
        User,
        UserProfile,
        DetachedProfile,
        Match, UserMatches,
        MatchRequest,
        DiscoveryQueue,
        TestObject,
        ImageSizes,
        MatchingSchemas];

      const resolvers = {
        Query: {},
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
        // engine must be null if creating test DB
        engine: (devMode && regenTestDBMode) ? null : {
          apiKey: 'service:pear-matchmaking-8936:V43kf4Urhi-63wQycK_yoA',
        },
        dataSources: () => dataSourcesObject,
        tracing: devMode,
        playground: devMode,
        introspection: devMode,
      });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      // app.use(cors())


      server.applyMiddleware({ app });
      app.post('/echo', (req, res) => {
        res.json(req.body);
      });

      app.post('/sms-test', (req, res) => {
        sendMessage('+12067789236', 'hello!');
        res.json(req.body);
      });

      // only expose this route if in regenTestDBMode
      if (devMode && regenTestDBMode) {
        app.get('/test-client', async (req, res) => {
          try {
            debug('first, clearing all previous dev-test collections...');
            const collectionDropPromises = [];
            const collectionInfos = await db.db.listCollections()
              .toArray();
            collectionInfos.forEach((collectionInfo) => {
              debug(`dropping collection ${collectionInfo.name}`);
              collectionDropPromises.push(db.dropCollection(collectionInfo.name)
                .then(() => {
                  debug(`dropped collection ${collectionInfo.name}`);
                }));
            });
            await Promise.all(collectionDropPromises);
            await createTestDB(server);
            res.send('success');
          } catch (e) {
            debug(e);
            res.send(`an error occurred ${e.toString()}`);
          }
        });
      }

      app.listen({
        port: PORT,
        ip: URL,
      }, () => debug(`🚀 Server ready at ${URL}:${PORT}${server.graphqlPath}`));
    });
  } catch (e) {
    debug(e);
  }
};


export default start;
