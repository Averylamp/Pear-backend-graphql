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

const { ApolloServer } = require('apollo-server-express');

const debug = require('debug')('dev:Start');
const prodConsole = require('debug')('prod:Start');

let tracing = false;
if (process.env.PERF) {
  tracing = true;
  debug('Perf mode detected');
}

let devMode = false;
let regenTestDBMode = false;
if (process.env.DEV === 'true') {
  debug('Dev Mode detected');
  devMode = true;
  if (process.env.REGENDB === 'true') {
    debug('RegenDB Mode detected');
    regenTestDBMode = true;
  }
}


const URL = 'http://localhost';
const PORT = 1234;
let dbName = 'dev';
if (process.env.DBNAME !== null) {
  dbName = process.env.DBNAME;
}
debug(`Database: ${dbName}`);
prodConsole('Running in Prod');
prodConsole(`Database: ${dbName}`);

let mongoUrl = `mongodb+srv://avery:0bz8M0eMEtyXlj2aZodIPpJpy@cluster0-w4ecv.mongodb.net/${dbName}?retryWrites=true`;
if (process.env.CIRCLECI === 'true') {
  // mongoUrl = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}.localhost:27017/${dbName}`;
  mongoUrl = `mongodb://localhost:27017/${dbName}`;
}

export const MONGO_URL = mongoUrl;
const mongoose = require('mongoose');

debug(MONGO_URL);

const name = 'Pear';
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
    engine: (devMode && regenTestDBMode) ? null : {
      apiKey: 'service:pear-matchmaking-8936:V43kf4Urhi-63wQycK_yoA',
    },
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
    mongoose.set('useCreateIndex', true);
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
