import { dbOld } from '../migration1/Migration1Setup';

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
  testField: String!
}
`;

const TestObjectSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  testField: { type: Schema.Types.String, required: true },
});

export const TestObjectOld = dbOld.model('TestObject', TestObjectSchema);

export const createTestObjectFn = (testObjectInput, _id = mongoose.Types.ObjectId()) => {
  const testObjectModel = new TestObjectOld(testObjectInput);
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
