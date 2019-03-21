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
} from './models/UserProfileModel';
import {
  resolvers as UserProfileResolvers,
} from './resolvers/UserProfileResolver';
import {
  typeDef as ImageContainer,
} from './models/ImageSchemas';
import {
  resolvers as ImageResolvers,
} from './resolvers/ImageResolver';
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
} from './models/MatchingSchemas';
import {
  updateDiscoveryForUserById,
} from './discovery/DiscoverProfile';

const { ApolloServer } = require('apollo-server-express');

const debug = require('debug')('dev:Start');
const errorLog = require('debug')('dev:error:Start');
const prodConsole = require('debug')('prod:Start');


const devMode = process.env.DEV === 'true';
const regenTestDBMode = (process.env.REGEN_DB === 'true' && devMode);
if (devMode) debug('Dev Mode detected');
if (regenTestDBMode) {
  debug('RegenDB Mode detected');
  if (!process.env.DB_NAME) {
    errorLog('You must set the DB_NAME of the DB you wish to regenerate');
    errorLog('Try again with:');
    errorLog('DB_NAME=dev-test yarn regendb');
    process.exit(1);
  }
  if (process.env.DB_NAME === 'prod' && process.env.REGEN !== 'uwu') {
    errorLog('Are you really sure you want to regen the prod database?');
    errorLog('If you are try again with:');
    errorLog('DB_NAME=prod REGEN=uwu yarn regendb');
    process.exit(1);
  }
}
const tracing = process.env.PERF === 'true' ? true : false;
if (tracing) debug('Perf mode detected');

const URL = 'http://localhost';
const PORT = 1234;
const dbHost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const mongoPrefix = dbHost.includes('localhost') ? 'mongodb://' : 'mongodb+srv://';
const dbName = process.env.DB_NAME ? process.env.DB_NAME : 'dev';
const dbUser = process.env.DB_USER ? process.env.DB_USER : '';
const dbPass = process.env.DB_PASS ? process.env.DB_PASS : '';
debug(`Database: ${dbName}`);
prodConsole('Running in Prod');
prodConsole(`Database: ${dbName}`);

export const MONGO_URL = `${mongoPrefix}${dbUser}${dbPass}${dbHost}/${dbName}?retryWrites=true`;
const mongoose = require('mongoose');

debug(MONGO_URL);
prodConsole(`Mongo URL: ${MONGO_URL}`);

const name = process.env.APP_NAME ? process.env.APP_NAME : 'Pear GraphQL Server';
debug('Booting %s', name);

function createApolloServer() {
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
    ImageContainer,
    MatchingSchemas];

  const resolvers = {
    Query: {},
  };

  const finalResolvers = merge(resolvers,
    UserResolvers,
    DetachedProfileResolvers,
    MatchResolvers,
    UserMatchesResolvers,
    MatchRequestResolvers,
    DiscoveryQueueResolvers,
    TestObjectResolvers,
    ImageResolvers,
    UserProfileResolvers);


  const server = new ApolloServer({
    typeDefs: finalTypeDefs,
    resolvers: finalResolvers,
    // engine must be null if creating test DB
    engine: (process.env.ENGINE_API_KEY) ? process.env.ENGINE_API_KEY : null,
    tracing,
    playground: devMode,
    introspection: devMode,
  });
  return server;
}

export const apolloServer = createApolloServer();

export const start = async () => {
  try {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    mongoose.Promise = global.Promise;
    // Fix for Mongoose Errors: https://github.com/Automattic/mongoose/issues/6890
    mongoose.set('useCreateIndex', true);
    // Fix for Mongoose Errors: https://github.com/Automattic/mongoose/issues/6880
    mongoose.set('useFindAndModify', false);
    const db = mongoose.connection;
    db.on('error', debug.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
      debug('Mongo connected');
      prodConsole('Mongo connected');


      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      // app.use(cors())
      const server = apolloServer;

      server.applyMiddleware({ app });
      app.post('/echo', (req, res) => {
        res.json(req.body);
      });

      app.post('/sms-test', (req, res) => {
        sendMessage('+12067789236', 'hello!');
        res.json(req.body);
      });

      // only expose this route if in devMode
      if (devMode) {
        app.post('/add-to-discovery', async (req, res) => {
          try {
            const { user_id } = req.body;
            debug(`adding to discovery for user: ${user_id}`);
            await updateDiscoveryForUserById(user_id);
            res.send('success');
          } catch (e) {
            debug(e.toString());
            res.send(`an error occurred ${e.toString()}`);
          }
        });
      }

      app.listen({
        port: PORT,
        ip: URL,
      }, () => {
        debug(`🚀 Server ready at ${URL}:${PORT}${server.graphqlPath}`);
        prodConsole(`🚀 Server ready at ${URL}:${PORT}${server.graphqlPath}`);
      });
    });
  } catch (e) {
    debug(e);
  }
};


export default start;
