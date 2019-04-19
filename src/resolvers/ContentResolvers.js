import { User } from '../models/UserModel';
import { createTestObjectFn } from '../models/TestModel';

export const resolvers = {
  Query: {},
  Mutation: {
    addQuestions: async (_source, { newQuestions }) => null,
    addQuestion: async (_source, { newQuestion }) => null,
  },
  Bio: {
    author: async ({ author_id }) => User.findByid(author_id),
  },
};
