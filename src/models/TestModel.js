const mongoose = require('mongoose');

const { Schema } = mongoose;
const debug = require('debug')('dev:TestObject');

export const typeDef = `
extend type Query {
  testObject(id: ID!): TestObject
  testObjects: [TestObject!]!
}

extend type Mutation {
  createTestObject(testField: String!): TestObject!
}

type TestObject {
  _id: ID!
  test_field: String!
}
`;

export const resolvers = {
  Query: {
    testObject: async (_source, { id }, { dataSources }) => {
      debug(`Getting test object by id: ${id}`);
      return dataSources.testObjectDB.findOne({ _id: id });
    },
    testObjects: async (_source, _, { dataSources }) => {
      debug('Getting all test objects.');
      return dataSources.testObjectDB.find();
    },
  },
  Mutation: {
    createTestObject: async (_source, { testField }, { dataSources }) => {
      debug(testField);
      const createdTestObj = createTestObjectFn()
    }
  }
};

const TestObjectSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  test_field: { type: Schema.Types.String, required: true },
});

export const TestObject = mongoose.model('TestObject', TestObjectSchema);

export const createTestObjectFn = (testObjectInput, _id = mongoose.Types.ObjectId()) => {
  const testObjectModel = new TestObject(testObjectInput);
  testObjectModel._id = _id;
  debug(testObjectModel);
  return new Promise((resolve, reject) => {
    testObjectModel.save((err) => {
      if (err) {
        debug(err);
        reject(err);
      }
      resolve(testObjectModel);
    });
  });
};
