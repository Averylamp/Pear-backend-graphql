const mongoose = require('mongoose');

const { Schema } = mongoose;

const queryRoutes = `
extend type Query {
  # get all questions
  getAllQuestions: [Question!]!
  
  # get question by id
  getQuestionById: Question
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
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input BioInput {
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean!
}
`;

const boastType = `
type Boast {
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input BoastInput {
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const roastType = `
type Roast {
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input RoastInput {
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const doType = `
type Do {
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input DoInput {
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const dontType = `
type Dont {
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input DontInput {
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

const interestType = `
type Interest {
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input InterestInput {
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
  questionTextWithName: String
  questionType: QuestionType!
  suggestedResponses: [QuestionSuggestedResponse!]!
  
  # shows up in questionnaire or not
  hiddenInQuestionnaire: Boolean!
  # shows up in profiles or not
  hiddenInProfile: Boolean!
}

input NewQuestionInput {
  questionText: String!
  questionTextWithName: String
  questionType: QuestionType!
  suggestedResponses: [QuestionSuggestedResponseInput!]!
}

type QuestionSuggestedResponse {
  _id: ID!
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
  author_id: ID!
  author: User
  authorFirstName: String!
  
  # the ID, referencable in the firebase remote config
  question_id: ID!
  question: Question!
  
  responseBody: String!
  responseTitle: String
  color: Color
  icon: IconAssetRef
  
  hidden: Boolean!
}

input QuestionUserResponseInput {
  author_id: ID!
  authorFirstName: String!
  questionID: String!
  questionText: String!
  responseBody: String!
  responseTitle: String
  color: ColorInput
  icon: IconAssetRefInput
  hidden: Boolean
}
`;

const vibeType = `
type Vibe {
  author_id: ID!
  author: User
  authorFirstName: String!
  
  content: String!
  hidden: Boolean!
}

input VibeInput {
  author_id: ID!
  authorFirstName: String!
  content: String!
  hidden: Boolean
}
`;

export const typeDef = bioType
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
  questionTextWithName: { type: String, required: false },
  questionType: {
    type: String,
    required: true,
    enum: ['multipleChoice', 'multipleChoiceWithOther', 'freeResponse'],
  },
  suggestedResponses: { type: [QuestionSuggestedResponseSchema], required: false },
  hiddenInQuestionnaire: { type: Boolean, required: true, default: false },
  hiddenInProfile: { type: Boolean, required: true, default: false },
});

export const BioSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
});

export const BoastSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
});

export const RoastSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
});

export const DoSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
});

export const DontSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
});

export const InterestSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
});

export const QuestionUserResponseSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  question_id: { type: Schema.Types.ObjectId, required: true },
  responseBody: { type: String, required: true },
  responseTitle: { type: String, required: false },
  color: { type: ColorSchema, required: false },
  icon: { type: IconAssetRefSchema, required: false },
  hidden: { type: Boolean, required: true, default: false },
});

export const VibeSchema = new Schema({
  author_id: { type: Schema.Types.ObjectId, required: true, index: true },
  authorFirstName: { type: String, required: true },
  content: { type: String, required: true },
  hidden: { type: Boolean, required: true, default: false },
});

export const Question = mongoose.model('Question', QuestionSchema);
