import { createTestClient } from 'apollo-server-testing';
import { GET_USER } from './Queries';

const debug = require('debug')('dev:CreateTestDB');

const createTestDB = async (server) => {
  debug('creating test DB');
  const { query } = createTestClient(server);
  const res = await query({ query: GET_USER, variables: { id: '5c81dbe527d50375cf6b96aa' } });
  debug(res);
};

export default createTestDB;
