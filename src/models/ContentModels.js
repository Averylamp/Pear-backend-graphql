const mongoose = require('mongoose');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # get all questions
  getAllQuestions: [Question!]!
  
  # get question by id
  getQuestionById(question_id: ID!): Question
}
`;

const mutationRoutes = `
extend type Mutation {
  # add multiple questions
  addQuestions(newQuestions: [NewQuestionInput!]!): [Question!]!
  
  # add single question
  addQuestion(newQuestion: NewQuestionInput!): Question
}
`;

const bioType = `
type Bio {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input BioInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const boastType = `
type Boast {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input BoastInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const roastType = `
type Roast {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input RoastInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const vibeType = `
type Vibe {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input VibeInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const doType = `
type Do {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input DoInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const dontType = `
type Dont {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input DontInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const interestType = `
type Interest {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input InterestInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const colorType = `
type Color {
  red: Float!
  green: Float!
  blue: Float!
  alpha: Float!
}

input ColorInput {
  red: Float!
  green: Float!
  blue: Float!
  alpha: Float!
}
`;

const iconAssetRefType = `
type IconAssetRef {
  assetString: String
  assetURL: String
}

input IconAssetRefInput {
  assetString: String
  assetURL: String
}
`;

const questionType = `
type Question {
  _id: ID!
  questionText: String!
  questionSubtext: String
  questionTextWithName: String
  questionType: QuestionType!
  suggestedResponses: [QuestionSuggestedResponse!]!
  placeholderResponseText: String
  
  # shows up in questionnaire or not
  hiddenInQuestionnaire: Boolean!
  # shows up in profiles or not
  hiddenInProfile: Boolean!
}

input NewQuestionInput {
  # optional, for testing
  _id: ID
  questionText: String!
  questionSubtext: String
  questionTextWithName: String
  questionType: QuestionType!
  suggestedResponses: [QuestionSuggestedResponseInput!]!
  placeholderResponseText: String
}

type QuestionSuggestedResponse {
  responseBody: String!
  responseTitle: String
  color: Color
  icon: IconAssetRef
}

input QuestionSuggestedResponseInput {
  responseBody: String!
  responseTitle: String
  color: ColorInput
  icon: IconAssetRefInput
}

enum QuestionType {
  multipleChoice
  multipleChoiceWithOther
  freeResponse
}
`;

const questionUserResponseType = `
type QuestionUserResponse {
  _id: ID!
  author_id: ID!
  author: User
  authorFirstName: String!
 
  question_id: ID!
  question: Question!
  
  responseBody: String!
  responseTitle: String
  color: Color
  icon: IconAssetRef
  
  hidden: Boolean!
}

input QuestionUserResponseInput {
  # _id is optional. if it's set, it replaces an existing bio if one exists w/same id. else
  # if not set, we just insert a new bio.
  _id: ID
  author_id: ID!
  authorFirstName: String!
  question_id: ID!
  question: NewQuestionInput!
  responseBody: String!
  responseTitle: String
  color: ColorInput
  icon: IconAssetRefInput
  hidden: Boolean
}
`;

export const typeDef = queryRoutes
+ mutationRoutes
+ bioType
+ boastType
+ roastType
+ colorType
+ iconAssetRefType
+ questionType
+ questionUserResponseType
+ vibeType
+ doType
+ dontType
+ interestType;

export const ColorSchema = new Schema({
  red: { type: Number, required: true, default: 0.0 },
  green: { type: Number, required: true, default: 0.0 },
  blue: { type: Number, required: true, default: 0.0 },
  alpha: { type: Number, required: true, default: 1.0 },
});

export const IconAssetRefSchema = new Schema({
  assetString: { type: String, required: false },
  assetURL: { type: String, required: false },
});

export const QuestionSuggestedResponseSchema = new Schema({
  responseBody: { type: String, required: true },
  responseTitle: { type: String, required: false },
  color: { type: ColorSchema, required: false },
  icon: { type: IconAssetRefSchema, required: false },
});

export const QuestionSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  questionText: { type: String, required: true },
  questionSubtext: { type: String, required: false },
  questionTextWithName: { type: String, required: false },
  questionType: {
    type: String,
    required: true,
    enum: ['multipleChoice', 'multipleChoiceWithOther', 'freeResponse'],
  },
  suggestedResponses: { type: [QuestionSuggestedResponseSchema], required: false },
  placeholderResponseText: { type: String, required: false },
  hiddenInQuestionnaire: { type: Boolean, required: true, default: false },
  hiddenInProfile: { type: Boolean, required: true, default: false },
}, { timestamps: true });

export const QuestionUserResponseSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  question_id: { type: Schema.Types.ObjectId, required: true },
  question: { type: QuestionSchema, required: true },
  responseBody: { type: String, required: true },
  responseTitle: { type: String, required: false },
  color: { type: ColorSchema, required: false },
  icon: { type: IconAssetRefSchema, required: false },
  hidden: { type: Boolean, required: true, default: false },
});

const simpleContentSchemaObject = {
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
};

export const BioSchema = new Schema(simpleContentSchemaObject, { timestamps: true });

export const BoastSchema = new Schema(simpleContentSchemaObject, { timestamps: true });

export const RoastSchema = new Schema(simpleContentSchemaObject, { timestamps: true });

export const DoSchema = new Schema(simpleContentSchemaObject, { timestamps: true });

export const DontSchema = new Schema(simpleContentSchemaObject, { timestamps: true });

export const InterestSchema = new Schema(simpleContentSchemaObject, { timestamps: true });

export const VibeSchema = new Schema(simpleContentSchemaObject, { timestamps: true });

export const Question = mongoose.model('Question', QuestionSchema);
