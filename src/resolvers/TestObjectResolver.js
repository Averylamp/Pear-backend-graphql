import { createTestObjectFn, TestObject } from '../models/TestModel';

const debug = require('debug')('dev:TestObject');

export const resolvers = {
  Query: {
    testObject: async (_, { id }) => {
      debug(`Getting test object by id: ${id}`);
      return TestObject.findById(id);
    },
    testObjects: async () => {
      debug('Getting all test objects.');
      return TestObject.find();
    },
    echo: async (_, { message }) => message,
  },
  Mutation: {
    createTestObject: async (_source, { testField }) => {
      debug(testField);
      const createdTestObj = await createTestObjectFn({ testField });
      return createdTestObj;
    },
  },
};
