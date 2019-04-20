import { User } from '../models/UserModel';
import { Question } from '../models/ContentModels';
import { pick } from 'lodash';

const mongoose = require('mongoose');
const errorLog = require('debug')('error:ContentResolvers');

export const resolvers = {
  Query: {
    getQuestionById: async (_source, { question_id }) => Question.findById(question_id).exec(),
    getAllQuestions: async () => Question.find({}).exec(),
  },
  Mutation: {
    addQuestions: async (_source, { newQuestions }) => {
      try {
        const newQuestionPromises = [];
        for (const newQuestion of newQuestions) {
          const question_id = '_id' in newQuestion ? newQuestion._id : mongoose.Types.ObjectId();
          const finalQuestionInput = pick(newQuestion, [
            'questionText',
            'questionSubtext',
            'questionTextWithName',
            'questionType',
            'suggestedResponses',
            'placeholderResponseText',
          ]);
          finalQuestionInput._id = question_id;
          const questionModel = new Question(finalQuestionInput);
          newQuestionPromises.push(questionModel.save());
        }
        return Promise.all(newQuestionPromises).catch((err) => {
          errorLog(err);
        });
      } catch (e) {
        errorLog(`An error occurred: ${e}`);
        return [];
      }
    },
    addQuestion: async (_source, { newQuestion }) => {
      try {
        const question_id = '_id' in newQuestion ? newQuestion._id : mongoose.Types.ObjectId();
        const finalQuestionInput = pick(newQuestion, [
          'questionText',
          'questionSubtext',
          'questionTextWithName',
          'questionType',
          'suggestedResponses',
          'placeholderResponseText',
        ]);
        finalQuestionInput._id = question_id;
        const questionModel = new Question(finalQuestionInput);
        return questionModel.save();
      } catch (e) {
        errorLog(`An error occurred: ${e}`);
        return null;
      }
    },
  },
  Bio: {
    author: async ({ author_id }) => User.findById(author_id),
  },
  Boast: {
    author: async ({ author_id }) => User.findById(author_id),
  },
  Roast: {
    author: async ({ author_id }) => User.findById(author_id),
  },
  Vibe: {
    author: async ({ author_id }) => User.findById(author_id),
  },
  Do: {
    author: async ({ author_id }) => User.findById(author_id),
  },
  Dont: {
    author: async ({ author_id }) => User.findById(author_id),
  },
  Interest: {
    author: async ({ author_id }) => User.findById(author_id),
  },
  QuestionUserResponse: {
    author: async ({ author_id }) => User.findById(author_id),
    question: async ({ question_id }) => Question.findById(question_id),
  },
};
