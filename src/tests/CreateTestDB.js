import { createTestClient } from 'apollo-server-testing';
import {
  CREATE_AVERY_DETACHED_PROFILE_VARIABLES,
  CREATE_AVERY_USER_VARIABLES, CREATE_BRIAN_USER_VARIABLES,
  CREATE_DETACHED_PROFILE,
  CREATE_USER,
} from './Mutations';

const debug = require('debug')('dev:CreateTestDB');

const createTestDB = async (server) => {
  debug('creating new test db');
  const { mutate } = createTestClient(server);
  debug('creating user Brian');
  const msg2 = await mutate({
    mutation: CREATE_USER,
    variables: CREATE_BRIAN_USER_VARIABLES,
  });
  debug(msg2);
  debug('creating user Avery');
  const msg1 = await mutate({
    mutation: CREATE_USER,
    variables: CREATE_AVERY_USER_VARIABLES,
  });
  debug(msg1);
  debug('creating detached profile Avery');
  const msg3 = await mutate({
    mutation: CREATE_DETACHED_PROFILE,
    variables: CREATE_AVERY_DETACHED_PROFILE_VARIABLES,
  });
  debug(msg3);
};

export default createTestDB;
